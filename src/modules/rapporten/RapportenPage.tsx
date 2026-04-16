
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, FullReport, ReportStatus } from '../../data/store';
import { Plus, FileText, User, Shield, ChevronRight, X, Search, CheckCircle, XCircle, Image as ImageIcon, Printer, Download } from 'lucide-react';
import { FeedbackModal } from './components/FeedbackModal';
import { makeRef } from '../../utils/pdf/ref';
import { generateRapportDetailPdf } from './utils/generateRapportPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';
import clsx from 'clsx';

export const RapportenPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reports, shifts, createReport, approveReport, rejectReport, clients, locations } = useStore();
  
  const [activeTab, setActiveTab] = useState<ReportStatus | 'All'>('Submitted');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  
  // New Report Form State
  const [newType, setNewType] = useState<'Daily' | 'Incident' | 'Patrol'>('Daily');
  const [newShiftId, setNewShiftId] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesTab = activeTab === 'All' ? true : r.status === activeTab;
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        r.title?.toLowerCase().includes(query) || 
        r.author.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, activeTab, searchQuery]);

  const handleCreate = () => {
    // Robust ID generation
    const newId = makeRef('R');
    
    const newReport: FullReport = {
      id: newId,
      type: newType,
      author: 'Admin', 
      date: new Date().toISOString().split('T')[0],
      title: `${t(`reports.types.${newType}`)} - ${new Date().toLocaleDateString()}`,
      summary: '',
      details: '',
      shiftId: newShiftId,
      status: 'Draft',
      images: [],
      auditLog: [{ action: 'Created', user: 'Admin', date: new Date().toISOString() }]
    };
    
    createReport(newReport);
    setIsModalOpen(false);
    navigate(`/rapporten/${newReport.id}`);
  };

  const handleQuickApprove = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    approveReport(id);
  };

  const handleQuickReject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFeedbackId(id);
  };

  const generateBlob = (report: FullReport) => {
      const shift = shifts.find(s => s.id === report.shiftId);
      const client = clients.find(c => c.name === shift?.clientName); // approximate lookup
      const location = locations.find(l => l.name === shift?.location); // approximate lookup
      return generateRapportDetailPdf(report, client, location, shift);
  };

  const handlePrint = (e: React.MouseEvent, report: FullReport) => {
    e.preventDefault();
    e.stopPropagation();
    const { blob } = generateBlob(report);
    printPdfBlob(blob);
  };

  const handleDownload = (e: React.MouseEvent, report: FullReport) => {
    e.preventDefault();
    e.stopPropagation();
    const { blob, filename } = generateBlob(report);
    downloadPdf(blob, filename);
  };

  const TabButton = ({ status, label }: { status: ReportStatus | 'All'; label: string }) => (
    <button
      onClick={() => setActiveTab(status)}
      className={clsx(
        "pb-3 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
        activeTab === status 
          ? "border-apex-gold text-white" 
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
      <span className={clsx("text-xs py-0.5 px-2 rounded-full", activeTab === status ? "bg-apex-gold text-black" : "bg-zinc-800 text-zinc-400")}>
        {status === 'All' ? reports.length : reports.filter(r => r.status === status).length}
      </span>
    </button>
  );

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('reports.title')}</h2>
           <p className="text-zinc-400 mt-1">{t('reports.subtitle')}</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-apex-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-apex-gold/20 flex items-center gap-2 active:scale-95"
        >
           <Plus className="w-5 h-5" /> {t('reports.new')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-end">
        <div className="flex space-x-1 border-b border-zinc-800 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <TabButton status="Submitted" label={t('reports.status.Submitted')} />
          <TabButton status="Approved" label={t('reports.status.Approved')} />
          <TabButton status="Rejected" label={t('reports.status.Rejected')} />
          <TabButton status="Draft" label={t('reports.status.Draft')} />
          <TabButton status="All" label={t('personeel.filter.all')} />
        </div>
        
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
           <input 
              type="text" 
              placeholder={t('common.search')} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-apex-gold outline-none transition-colors"
           />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
           <div className="py-16 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
             <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>Geen rapporten gevonden.</p>
           </div>
        ) : (
           filteredReports.map(report => {
             const shift = shifts.find(s => s.id === report.shiftId);
             
             return (
               <Link 
                 to={`/rapporten/${report.id}`} 
                 key={report.id} 
                 className="block group relative"
               >
                 <div className={clsx(
                   "bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between",
                   "transition-all duration-200 hover:shadow-[0_0_25px_rgba(212,175,55,0.08)] hover:border-apex-gold/30 hover:bg-zinc-900",
                   "active:scale-[0.99] relative overflow-hidden backdrop-blur-sm"
                 )}>
                   
                   {/* Status Indicator Strip */}
                   <div className={clsx("absolute left-0 top-0 bottom-0 w-1 transition-colors", 
                      report.status === 'Draft' ? 'bg-zinc-600' :
                      report.status === 'Approved' ? 'bg-green-500' :
                      report.status === 'Rejected' ? 'bg-red-500' :
                      'bg-blue-500'
                   )} />

                   <div className="flex items-start gap-5 pl-2">
                      <div className="h-12 w-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                        <FileText className={clsx("w-6 h-6", report.type === 'Incident' ? "text-red-400" : "text-apex-gold")} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase border backdrop-blur-sm",
                              report.type === 'Incident' ? "bg-red-900/20 text-red-400 border-red-900/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                           )}>
                              {t(`reports.types.${report.type}`) || report.type}
                           </span>
                           <span className="text-zinc-500 text-xs font-mono">{report.date}</span>
                           {report.images && report.images.length > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                 <ImageIcon className="w-3 h-3" /> {report.images.length}
                              </span>
                           )}
                        </div>
                        <h4 className="text-white font-bold text-lg group-hover:text-apex-gold transition-colors truncate pr-4">
                           {report.title || 'Naamloos Rapport'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-zinc-400">
                           <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3" /> {report.author}
                           </span>
                           {shift && (
                              <span className="flex items-center gap-1.5">
                                 <Shield className="w-3 h-3" /> {shift.clientName}
                              </span>
                           )}
                        </div>
                      </div>
                   </div>

                   <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-4 pl-2 md:pl-0">
                      
                      {/* Quick Actions for Submitted Reports */}
                      {report.status === 'Submitted' && (
                        <div className="flex items-center gap-2 mr-4">
                           <button 
                              onClick={(e) => handleQuickApprove(e, report.id)}
                              className="p-2 bg-green-900/20 text-green-500 rounded-lg border border-green-900/30 hover:bg-green-900/40 hover:scale-105 transition-all"
                              title={t('reports.actions.approve')}
                           >
                              <CheckCircle className="w-5 h-5" />
                           </button>
                           <button 
                              onClick={(e) => handleQuickReject(e, report.id)}
                              className="p-2 bg-red-900/20 text-red-500 rounded-lg border border-red-900/30 hover:bg-red-900/40 hover:scale-105 transition-all"
                              title={t('reports.actions.reject')}
                           >
                              <XCircle className="w-5 h-5" />
                           </button>
                        </div>
                      )}

                      {/* PDF Actions */}
                      <div className="flex items-center gap-1 mr-4">
                          <button 
                            onClick={(e) => handleDownload(e, report)}
                            className="bg-zinc-950 p-2 rounded-l-lg border border-zinc-800 hover:border-zinc-500 transition-colors text-zinc-400 hover:text-white border-r-0"
                            title={t('reports.actions.download')}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handlePrint(e, report)}
                            className="bg-zinc-950 p-2 rounded-r-lg border border-zinc-800 hover:border-zinc-500 transition-colors text-zinc-400 hover:text-white"
                            title={t('reports.actions.print')}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                      </div>

                      <div className="bg-zinc-950 p-2 rounded-full border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                         <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white" />
                      </div>
                   </div>
                 </div>
               </Link>
             );
           })
        )}
      </div>

      {/* Modals */}
      <FeedbackModal 
        isOpen={!!feedbackId}
        onClose={() => setFeedbackId(null)}
        onConfirm={(reason) => {
          if (feedbackId) rejectReport(feedbackId, reason);
        }}
        title="Feedback"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
           <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-md shadow-2xl relative">
              <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Plus className="w-5 h-5 text-apex-gold" /> {t('reports.modalTitle')}
              </h3>

              <div className="space-y-4">
                 <div>
                    <label className="block text-sm text-zinc-400 mb-1">{t('reports.typeLabel')}</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['Daily', 'Patrol', 'Incident'] as const).map(type => (
                          <button
                             key={type}
                             onClick={() => setNewType(type)}
                             className={clsx(
                                "py-2 px-1 text-sm font-bold rounded border transition-colors",
                                newType === type 
                                  ? "bg-apex-gold text-black border-apex-gold shadow-md" 
                                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                             )}
                          >
                             {type}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm text-zinc-400 mb-1">{t('reports.linkShift')}</label>
                    <select
                       value={newShiftId}
                       onChange={e => setNewShiftId(e.target.value)}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white outline-none focus:border-apex-gold"
                    >
                       <option value="">{t('reports.noShift')}</option>
                       {shifts.map(s => (
                          <option key={s.id} value={s.id}>
                             {s.clientName} - {s.location} ({s.startTime.split('T')[0]})
                          </option>
                       ))}
                    </select>
                 </div>

                 <button 
                    onClick={handleCreate}
                    className="w-full bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 mt-4 transition-colors"
                 >
                    {t('reports.startDraft')}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
