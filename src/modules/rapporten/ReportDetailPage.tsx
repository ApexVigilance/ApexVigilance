import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore } from '../../data/store';
import { Save, Send, CheckCircle, XCircle, Upload, FileText, Image as ImageIcon, Trash2, Clock } from 'lucide-react';
import clsx from 'clsx';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { reports, shifts, updateReport, submitReport, approveReport, rejectReport, deleteReport } = useStore();
  
  const report = reports.find(r => r.id === id);
  const shift = shifts.find(s => s.id === report?.shiftId);

  // Local state for rejection modal
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!report) return <div className="p-8 text-white">Rapport niet gevonden.</div>;

  const isEditable = report.status === 'Draft';
  const isReviewable = report.status === 'Submitted';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       Array.from(e.target.files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
             if (reader.result) {
                updateReport(report.id, { 
                   images: [...report.images, reader.result as string] 
                });
             }
          };
          reader.readAsDataURL(file as Blob);
       });
    }
  };

  const removeImage = (index: number) => {
     const newImages = [...report.images];
     newImages.splice(index, 1);
     updateReport(report.id, { images: newImages });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-4">
         <BackButton />
         {isEditable && (
            <button 
               onClick={() => {
                  if (confirm('Weet je zeker dat je dit rapport wilt verwijderen?')) {
                     deleteReport(report.id);
                     navigate('/rapporten');
                  }
               }}
               className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1"
            >
               <Trash2 className="w-4 h-4" /> Verwijderen
            </button>
         )}
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className={clsx("px-2 py-0.5 text-xs font-bold uppercase rounded",
                     report.status === 'Draft' ? "bg-zinc-700 text-zinc-300" :
                     report.status === 'Submitted' ? "bg-blue-900/30 text-blue-400" :
                     report.status === 'Approved' ? "bg-green-900/30 text-green-400" :
                     "bg-red-900/30 text-red-400"
                  )}>
                     {report.status === 'Draft' ? 'Concept' : report.status === 'Submitted' ? 'Ingediend' : report.status === 'Approved' ? 'Goedgekeurd' : 'Afgekeurd'}
                  </span>
                  <span className="text-zinc-500 text-xs">#{report.id}</span>
               </div>
               <input 
                  type="text"
                  value={report.title || ''}
                  onChange={e => updateReport(report.id, { title: e.target.value })}
                  disabled={!isEditable}
                  placeholder="Titel van rapport..."
                  className="bg-transparent text-3xl font-bold text-white focus:outline-none focus:border-b focus:border-apex-gold w-full placeholder-zinc-700"
               />
               <div className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
                  <span>{report.date}</span>
                  <span>•</span>
                  <span>{report.author}</span>
                  {shift && <span className="text-apex-gold">• {shift.clientName} ({shift.location})</span>}
               </div>
            </div>

            <div className="flex items-center gap-2">
               {isEditable && (
                  <button 
                     onClick={() => submitReport(report.id)}
                     className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
                  >
                     <Send className="w-4 h-4" /> Indienen
                  </button>
               )}
               {isReviewable && (
                  <>
                     <button 
                        onClick={() => approveReport(report.id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
                     >
                        <CheckCircle className="w-4 h-4" /> Goedkeuren
                     </button>
                     <button 
                        onClick={() => setShowRejectModal(true)}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
                     >
                        <XCircle className="w-4 h-4" /> Afkeuren
                     </button>
                  </>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Content */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
               <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-apex-gold" /> Samenvatting
               </h3>
               <textarea 
                  value={report.summary || ''}
                  onChange={e => updateReport(report.id, { summary: e.target.value })}
                  disabled={!isEditable}
                  placeholder="Korte samenvatting van de gebeurtenissen..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-4 text-zinc-300 min-h-[100px] focus:border-apex-gold outline-none disabled:opacity-50 disabled:cursor-not-allowed"
               />
            </div>

            {/* Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
               <h3 className="text-white font-bold mb-2">Details</h3>
               <textarea 
                  value={report.details || ''}
                  onChange={e => updateReport(report.id, { details: e.target.value })}
                  disabled={!isEditable}
                  placeholder="Volledige omschrijving..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-4 text-zinc-300 min-h-[200px] focus:border-apex-gold outline-none disabled:opacity-50 disabled:cursor-not-allowed"
               />
            </div>

            {/* Images */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                     <ImageIcon className="w-4 h-4 text-apex-gold" /> Foto's & Bijlagen
                  </h3>
                  {isEditable && (
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded flex items-center gap-1"
                     >
                        <Upload className="w-3 h-3" /> Uploaden
                     </button>
                  )}
                  <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileUpload} 
                     className="hidden" 
                     accept="image/*" 
                     multiple 
                  />
               </div>
               
               {report.images.length === 0 ? (
                  <div className="text-zinc-500 text-sm italic py-4 text-center border border-dashed border-zinc-800 rounded">
                     Geen afbeeldingen toegevoegd.
                  </div>
               ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {report.images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square bg-black rounded overflow-hidden border border-zinc-800">
                           <img src={img} alt={`Attachment ${idx}`} className="w-full h-full object-cover" />
                           {isEditable && (
                              <button 
                                 onClick={() => removeImage(idx)}
                                 className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                 <XCircle className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Sidebar: Audit Log */}
         <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
               <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Audit Log</h3>
               <div className="space-y-4 relative pl-2">
                  <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-zinc-800" />
                  {report.auditLog?.map((log, i) => (
                     <div key={i} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-[24px] h-[24px] -ml-[11px] bg-zinc-900 border-2 border-zinc-700 rounded-full z-10 flex items-center justify-center">
                           <div className="w-1.5 h-1.5 bg-apex-gold rounded-full" />
                        </div>
                        <div className="text-sm font-bold text-white">{log.action}</div>
                        <div className="text-xs text-zinc-400">{new Date(log.date).toLocaleString()}</div>
                        <div className="text-xs text-zinc-500 italic">door {log.user}</div>
                        {log.reason && (
                           <div className="mt-1 text-xs text-red-400 bg-red-900/10 p-2 rounded border border-red-900/20">
                              "{log.reason}"
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-red-900 p-6 rounded-lg w-full max-w-md shadow-2xl">
               <h3 className="text-xl font-bold text-white mb-4">Rapport Afkeuren</h3>
               <p className="text-zinc-400 text-sm mb-4">Geef een reden op voor de afkeuring. Dit wordt gelogd in de audit trail.</p>
               <textarea 
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-24 mb-4 focus:border-red-500 outline-none"
                  placeholder="Reden..."
               />
               <div className="flex gap-3">
                  <button 
                     onClick={() => {
                        if (rejectReason) {
                           rejectReport(report.id, rejectReason);
                           setShowRejectModal(false);
                           setRejectReason('');
                        }
                     }}
                     disabled={!rejectReason}
                     className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2 rounded"
                  >
                     Bevestigen
                  </button>
                  <button 
                     onClick={() => setShowRejectModal(false)}
                     className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded"
                  >
                     Annuleren
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};