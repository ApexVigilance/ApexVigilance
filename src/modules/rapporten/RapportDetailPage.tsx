
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore } from '../../data/store';
import { Save, Send, CheckCircle, XCircle, Upload, FileText, Image as ImageIcon, Trash2, Clock, Shield, User, MapPin, Printer, Mail, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { FeedbackModal } from './components/FeedbackModal';
import { generateRapportDetailPdf } from './utils/generateRapportPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';
import clsx from 'clsx';

export const RapportDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { reports, shifts, clients, locations, updateReport, submitReport, approveReport, rejectReport, deleteReport, retryReportEmail } = useStore();
  
  const report = reports.find(r => r.id === id);
  const shift = shifts.find(s => s.id === report?.shiftId);

  // Local state for draft editing and UI
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = `apex_rapport_draft_${id}`;

  const isEditable = report?.status === 'Draft' || report?.status === 'Rejected';
  const isReviewable = report?.status === 'Submitted';

  // Initialize from LocalStorage draft or Store report
  useEffect(() => {
    if (report) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && isEditable) {
        try {
          const parsed = JSON.parse(savedDraft);
          setSummary(parsed.summary ?? report.summary ?? '');
          setDetails(parsed.details ?? report.details ?? '');
          setLocalImages(parsed.images ?? report.images ?? []);
        } catch (e) {
          setSummary(report.summary || '');
          setDetails(report.details || '');
          setLocalImages(report.images || []);
        }
      } else {
        setSummary(report.summary || '');
        setDetails(report.details || '');
        setLocalImages(report.images || []);
      }
    }
  }, [id, report?.id]);

  // Persist to LocalStorage
  useEffect(() => {
    if (!report || !isEditable) return;
    const dataToSave = { summary, details, images: localImages };
    localStorage.setItem(draftKey, JSON.stringify(dataToSave));
    const timeoutId = setTimeout(() => {
      updateReport(report.id, { summary, details, images: localImages });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [summary, details, localImages, isEditable, report?.id]);

  if (!report) return <div className="p-8 text-white text-center">Rapport niet gevonden.</div>;

  // Proof Bar Logic
  const hasLocation = !!report.locationId || !!report.shiftId || (!!report.gpsLat && !!report.gpsLng);
  const hasPhotos = report.images && report.images.length > 0;
  const isHighSeverity = report.severity === 'High' || report.severity === 'Critical';
  const photoProofOK = isHighSeverity ? hasPhotos : true;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       Array.from(e.target.files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
             if (reader.result) {
                setLocalImages(prev => [...prev, reader.result as string]);
             }
          };
          reader.readAsDataURL(file as Blob);
       });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
     setLocalImages(prev => prev.filter((_, i) => i !== index));
     if (selectedImage === localImages[index]) setSelectedImage(null);
  };

  const handleSubmit = () => {
    if (summary.trim().length < 10) {
      setValidationError('Samenvatting moet minimaal 10 tekens bevatten.');
      return;
    }
    setValidationError(null);
    updateReport(report.id, { summary, details, images: localImages });
    submitReport(report.id);
    localStorage.removeItem(draftKey);
  };

  const handleResubmit = () => {
     if (summary.trim().length < 10) {
      setValidationError('Samenvatting moet minimaal 10 tekens bevatten.');
      return;
    }
    setValidationError(null);
    updateReport(report.id, {
        summary,
        details,
        images: localImages,
        status: 'Submitted',
        auditLog: [...report.auditLog, { action: 'Resubmitted', user: 'Gebruiker', date: new Date().toISOString() }]
    });
    localStorage.removeItem(draftKey);
  };

  // -- PDF HANDLING --
  const generateBlob = () => {
      const client = clients.find(c => c.name === shift?.clientName);
      const location = locations.find(l => l.clientId === client?.id && shift?.location.includes(l.name));
      return generateRapportDetailPdf(report, client, location, shift);
  };

  const handleDownloadPdf = () => {
      const { blob, filename } = generateBlob();
      downloadPdf(blob, filename);
  };

  const handlePrint = () => {
      const { blob } = generateBlob();
      printPdfBlob(blob);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
         <BackButton />
         {report.status === 'Draft' && (
            <button 
               onClick={() => {
                  if (confirm('Weet je zeker dat je dit rapport wilt verwijderen?')) {
                     deleteReport(report.id);
                     localStorage.removeItem(draftKey);
                     navigate('/rapporten');
                  }
               }}
               className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1 px-3 py-1 rounded hover:bg-red-900/10 transition-colors"
            >
               <Trash2 className="w-4 h-4" /> Verwijderen
            </button>
         )}
      </div>

      {/* PROOF BAR */}
      <div className="bg-zinc-900 border-b border-x border-zinc-800 rounded-t-xl p-4 flex items-center justify-between mb-1">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>{t('common.status')}: {new Date(report.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <MapPin className={clsx("w-4 h-4", hasLocation ? "text-green-500" : "text-zinc-600")} />
                  <span>Locatie: {hasLocation ? 'Gekoppeld' : 'Niet gespecificeerd'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <ImageIcon className={clsx("w-4 h-4", photoProofOK ? "text-green-500" : "text-red-500")} />
                  <span>Bewijs: {report.images?.length || 0} foto's</span>
              </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
              ID: {report.id}
          </div>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-b-xl p-6 mb-6 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-apex-gold/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
         
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-2">
                  <span className={clsx("px-2 py-0.5 text-xs font-bold uppercase rounded border backdrop-blur-sm",
                     report.status === 'Draft' ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                     report.status === 'Submitted' ? "bg-blue-900/20 text-blue-400 border-blue-900/30" :
                     report.status === 'Approved' ? "bg-green-900/20 text-green-400 border-green-900/30" :
                     "bg-red-900/20 text-red-400 border-red-900/30"
                  )}>
                     {t(`reports.status.${report.status}`)}
                  </span>
                  {report.type === 'Incident' && (
                      <span className={clsx("px-2 py-0.5 text-xs font-bold uppercase rounded border",
                          report.severity === 'High' ? "bg-red-900/30 text-red-400 border-red-900/50" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}>
                          {report.severity}
                      </span>
                  )}
                  {report.emailStatus && report.emailStatus !== 'NONE' && (
                      <span className={clsx("px-2 py-0.5 text-xs font-bold uppercase rounded border flex items-center gap-1",
                          report.emailStatus === 'SENT' ? "bg-green-900/20 text-green-400 border-green-900/50" : 
                          report.emailStatus === 'FAILED' ? "bg-red-900/20 text-red-400 border-red-900/50" : 
                          "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}>
                          <Mail className="w-3 h-3" />
                          {report.emailStatus === 'SENT' ? t('reports.email.sent') : t('reports.email.failed')}
                      </span>
                  )}
               </div>
               <input 
                  type="text"
                  value={report.title || ''}
                  onChange={e => updateReport(report.id, { title: e.target.value })}
                  disabled={!isEditable}
                  className="bg-transparent text-3xl font-bold text-white focus:outline-none focus:border-b focus:border-apex-gold w-full placeholder-zinc-700 disabled:opacity-80"
               />
               <div className="text-zinc-400 text-sm mt-2 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1"><User className="w-3 h-3 text-zinc-500" /> {report.author}</span>
                  {shift && <span className="flex items-center gap-1 text-apex-gold"><Shield className="w-3 h-3" /> {shift.clientName} ({shift.location})</span>}
               </div>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
               <button 
                  onClick={handleDownloadPdf}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-all mr-2"
               >
                  <Download className="w-4 h-4" /> {t('reports.actions.download')}
               </button>
               
               <button 
                  onClick={handlePrint}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-all mr-2"
               >
                  <Printer className="w-4 h-4" /> {t('reports.actions.print')}
               </button>

               {/* Resend Email Button */}
               {(report.emailStatus === 'FAILED' || (report.status === 'Approved' && report.emailStatus === 'SENT')) && (
                   <button 
                       onClick={() => retryReportEmail(report.id)}
                       className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-all mr-2"
                       title={t('reports.actions.resendEmail')}
                   >
                       <RefreshCw className="w-4 h-4" />
                   </button>
               )}

               {isEditable && (
                  <>
                     {validationError && (
                        <div className="text-red-400 text-xs font-bold bg-red-900/20 px-3 py-2 rounded animate-pulse border border-red-900/50 mr-2">
                           {validationError}
                        </div>
                     )}
                     <button 
                        onClick={report.status === 'Draft' ? handleSubmit : handleResubmit}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                     >
                        <Send className="w-4 h-4" /> {t('reports.actions.submit')}
                     </button>
                  </>
               )}
               {isReviewable && (
                  <>
                     <button 
                        onClick={() => approveReport(report.id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all active:scale-95"
                     >
                        <CheckCircle className="w-4 h-4" /> {t('reports.actions.approve')}
                     </button>
                     <button 
                        onClick={() => setShowRejectModal(true)}
                        className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-95"
                     >
                        <XCircle className="w-4 h-4" /> {t('reports.actions.reject')}
                     </button>
                  </>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Content */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Extended Details for Incident */}
            {report.type === 'Incident' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-apex-gold" /> Incident Specificaties
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Categorie</label>
                            <div className="text-white">{report.category}</div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Betrokkenen</label>
                            <div className="text-white">{report.involvedParties || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Voertuig Info</label>
                            <div className="text-white">{report.vehicleInfo || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Genomen Acties</label>
                            <div className="flex flex-wrap gap-2">
                                {report.actionsTaken?.map(a => (
                                    <span key={a} className="bg-zinc-800 px-2 py-1 rounded text-xs border border-zinc-700">{a}</span>
                                )) || '-'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 group focus-within:border-apex-gold transition-colors">
               <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-apex-gold" /> {t('reports.fields.summary')} <span className="text-zinc-600 text-xs font-normal">(Verplicht)</span>
               </h3>
               <textarea 
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  disabled={!isEditable}
                  className={clsx(
                     "w-full bg-zinc-950 border rounded-lg p-4 text-zinc-300 min-h-[100px] outline-none transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed",
                     validationError && summary.length < 10 ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-apex-gold"
                  )}
               />
            </div>

            {/* Details / Activities */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 group focus-within:border-apex-gold transition-colors">
               <h3 className="text-white font-bold mb-2">{t('reports.fields.details')}</h3>
               <textarea 
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  disabled={!isEditable}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 min-h-[250px] focus:border-apex-gold outline-none transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed"
               />
            </div>

            {/* Images */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                     <ImageIcon className="w-4 h-4 text-apex-gold" /> {t('reports.fields.photos')} ({localImages.length})
                  </h3>
                  {isEditable && (
                     <>
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors border border-zinc-700"
                        >
                           <Upload className="w-3 h-3" /> Upload
                        </button>
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleFileUpload} 
                           className="hidden" 
                           accept="image/*" 
                           multiple 
                        />
                     </>
                  )}
               </div>
               
               {localImages.length === 0 ? (
                  <div className="text-zinc-500 text-sm italic py-8 text-center border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
                     Geen afbeeldingen toegevoegd.
                  </div>
               ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {localImages.map((img, idx) => (
                        <div 
                           key={idx} 
                           onClick={() => setSelectedImage(img)}
                           className="relative group aspect-square bg-black rounded-lg overflow-hidden border border-zinc-800 cursor-pointer hover:border-apex-gold/50 transition-colors"
                        >
                           <img src={img} alt={`Bewijs ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Sidebar: Audit Log */}
         <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sticky top-24">
               <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Tijdlijn
               </h3>
               
               <div className="space-y-4 relative pl-3">
                  <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-zinc-800" />
                  
                  {report.auditLog?.slice().reverse().map((log, i) => (
                     <div key={i} className="relative pl-8 group">
                        <div className={clsx(
                           "absolute left-0 top-1 w-[24px] h-[24px] -ml-[11px] rounded-full z-10 flex items-center justify-center border-4 border-zinc-900 transition-colors",
                           log.action === 'Rejected' ? "bg-red-500" :
                           log.action === 'Approved' ? "bg-green-500" :
                           log.action === 'Submitted' ? "bg-blue-500" :
                           "bg-zinc-600"
                        )} />
                        
                        <div className="flex flex-col">
                           <span className={clsx("text-sm font-bold", 
                              log.action === 'Rejected' ? "text-red-400" : 
                              log.action === 'Approved' ? "text-green-400" : "text-white"
                           )}>
                              {log.action}
                           </span>
                           <span className="text-xs text-zinc-500 font-mono mt-0.5">
                              {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                           </span>
                           <span className="text-xs text-zinc-400 mt-1">door {log.user}</span>
                           
                           {log.reason && (
                              <div className="mt-2 text-xs text-red-300 bg-red-900/20 p-3 rounded border border-red-900/30 italic relative">
                                 "{log.reason}"
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
         <div 
            className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
         >
            <img src={selectedImage} className="max-w-full max-h-[85vh] rounded shadow-2xl" alt="Preview" onClick={e => e.stopPropagation()} />
            
            <button 
               className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
               onClick={() => setSelectedImage(null)}
            >
               <XCircle className="w-8 h-8" />
            </button>

            {isEditable && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                  <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        const idx = localImages.indexOf(selectedImage);
                        if (idx !== -1) removeImage(idx);
                     }}
                     className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-red-900/40 transition-all active:scale-95"
                  >
                     <Trash2 className="w-5 h-5" /> Verwijderen
                  </button>
               </div>
            )}
         </div>
      )}

      {/* Reject Modal */}
      <FeedbackModal 
         isOpen={showRejectModal}
         onClose={() => setShowRejectModal(false)}
         onConfirm={(reason) => {
            rejectReport(report.id, reason);
            setShowRejectModal(false);
         }}
         title="Rapport Terugsturen"
      />
    </div>
  );
};
