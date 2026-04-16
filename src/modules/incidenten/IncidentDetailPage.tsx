
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore } from '../../data/store';
import { useAuthStore } from '../../modules/auth/store';
import { 
    AlertTriangle, MapPin, Clock, FileText, MessageSquare, 
    CheckCircle, Send, XCircle, Printer, 
    History, Image as ImageIcon, Mail, RefreshCw, Archive, Download, AlertOctagon
} from 'lucide-react';
import { generateIncidentPdf } from './utils/generateIncidentPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';
import { FeedbackModal } from '../rapporten/components/FeedbackModal';
import { IncidentEmailModal } from './components/IncidentEmailModal';
import { sendIncidentEmail } from '../../services/emailApi';
import { blobToBase64 } from '../../utils/blobToBase64';
import clsx from 'clsx';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('fr') ? 'fr-BE' : 'nl-BE';
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
      incidents, shifts, clients, addIncidentComment, approveIncident, 
      rejectIncident, retryIncidentEmail, updateIncident 
  } = useStore();
  
  const incident = incidents.find(i => i.id === id);
  const shift = shifts.find(s => s.id === incident?.shiftId);
  const client = clients.find(c => c.id === incident?.clientId) || (shift ? clients.find(c => c.name === shift.clientName) : undefined);
  
  const [newComment, setNewComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);

  if (!incident) return <div className="text-white p-8">{t('incidenten.notFound')}</div>;

  // Permissions & State
  const isReviewable = incident.status === 'Submitted';
  const isArchivable = incident.status === 'Approved' || incident.status === 'Rejected';
  const authorName = user?.username || 'Admin';

  const handleApprove = () => {
      approveIncident(incident.id);
  };

  const handleArchive = () => {
      if (confirm(t('incidenten.confirmArchive'))) {
          updateIncident(incident.id, { 
              status: 'Archived', 
              auditLog: [...incident.auditLog, { action: 'Archived', user: authorName, date: new Date().toISOString() }] 
          });
          navigate('/incidenten');
      }
  };

  const handleAddComment = () => {
      if (newComment.trim()) {
          addIncidentComment(incident.id, newComment, authorName);
          setNewComment('');
      }
  };

  // --- PDF HANDLERS ---
  const generateBlob = () => {
      try {
          return generateIncidentPdf(incident, client, undefined, shift);
      } catch (e) {
          console.error("PDF Gen Error:", e);
          alert("Fout bij genereren PDF. Controleer console.");
          return { blob: new Blob(), filename: 'error.pdf' };
      }
  };

  const handleDownloadPdf = () => {
      const { blob, filename } = generateBlob();
      if (blob.size > 0) downloadPdf(blob, filename);
  };

  const handlePrint = () => {
      const { blob } = generateBlob();
      if (blob.size > 0) printPdfBlob(blob);
  };

  // --- EMAIL LOGIC ---
  const escapeHtml = (s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const handleSendEmail = async (to: string[], subject: string, message: string) => {
      setIsEmailing(true);
      // 1. Set status to PENDING
      updateIncident(incident.id, { emailStatus: 'PENDING' });

      try {
          // 2. Generate PDF
          const { blob, filename } = generateBlob();
          const base64Pdf = await blobToBase64(blob);

          // 3. Send via Service
          await sendIncidentEmail({
              to,
              subject,
              html: `
                <p>${t('incidenten.emailTemplate.greeting')}</p>
                <p>${t('incidenten.emailTemplate.body', { id: incident.id })}</p>
                ${message ? `<p><strong>${t('incidenten.emailTemplate.noteLabel')}</strong> ${escapeHtml(message)}</p>` : ''}
                <p>${t('incidenten.emailTemplate.signatureLine1')}<br/>${t('incidenten.emailTemplate.signatureLine2')}</p>
              `,
              attachments: [{
                  filename,
                  contentBase64: base64Pdf,
                  contentType: 'application/pdf'
              }]
          });

          // 4. Success Update
          updateIncident(incident.id, { 
              emailStatus: 'SENT', 
              emailedAt: new Date().toISOString(),
              auditLog: [...incident.auditLog, { action: 'Emailed', user: authorName, date: new Date().toISOString() }]
          });
          alert(t('incidenten.alerts.emailSuccess'));

      } catch (e: any) {
          console.error("Email send failed", e);
          // 5. Fail Update
          updateIncident(incident.id, { 
              emailStatus: 'FAILED', 
              emailError: e.message || 'Unknown error',
              auditLog: [...incident.auditLog, { action: 'Email Failed', user: authorName, date: new Date().toISOString() }]
          });
          alert(`${t('incidenten.alerts.emailFail')}${e.message}`);
      } finally {
          setIsEmailing(false);
      }
  };

  const handleRetryEmail = () => {
      retryIncidentEmail(incident.id); // Reset state in store first
      setShowEmailModal(true);
  };

  return (
    <div className="pb-12 max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-300">
        <div className="flex justify-between items-center mb-4">
            <BackButton />
            {incident.status === 'Draft' && (
                <span className="text-zinc-500 text-sm">{t('incidenten.isDraft')}</span>
            )}
        </div>
        
        {/* PROOF BAR */}
        <div className="bg-zinc-900 border-b border-x border-zinc-800 rounded-t-xl p-4 flex flex-wrap items-center justify-between gap-4 mb-1">
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span>{new Date(incident.date).toLocaleString(locale)}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <MapPin className={clsx("w-4 h-4", shift ? "text-green-500" : "text-zinc-600")} />
                    <span>{shift ? `${shift.clientName} - ${shift.location}` : t('incidenten.noContext')}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <ImageIcon className={clsx("w-4 h-4", incident.photos.length > 0 ? "text-green-500" : "text-zinc-600")} />
                    <span>{incident.photos.length} {t('incidenten.fields.photos')}</span>
                </div>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
                ID: {incident.id}
            </div>
        </div>

        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-b-lg mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-apex-gold/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="w-full md:flex-1 min-w-0">
                   <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                       <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight truncate max-w-full">{incident.title}</h2>
                       <span className={clsx("px-3 py-1 text-xs font-bold uppercase rounded border backdrop-blur-sm",
                           incident.status === 'Submitted' ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' :
                           incident.status === 'Rejected' ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-green-900/30 text-green-400 border-green-900/50'
                       )}>{t(`incidenten.status.${incident.status}`)}</span>
                       <span className={clsx("px-3 py-1 text-xs font-bold uppercase rounded border backdrop-blur-sm", 
                           incident.severity === 'Critical' ? "bg-purple-900/30 text-purple-400 border-purple-900/50" :
                           incident.severity === 'High' ? "bg-red-900/30 text-red-400 border-red-900/50" :
                           incident.severity === 'Medium' ? "bg-orange-900/30 text-orange-400 border-orange-900/50" : "bg-blue-900/30 text-blue-400 border-blue-900/50"
                       )}>{t(`incidenten.severity.${incident.severity}`)}</span>
                       
                       {/* Email Status Chip */}
                       {incident.emailStatus && incident.emailStatus !== 'NONE' && (
                           <span className={clsx("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border", 
                               incident.emailStatus === 'SENT' ? "bg-green-900/10 text-green-400 border-green-900/20" : 
                               incident.emailStatus === 'FAILED' ? "bg-red-900/10 text-red-400 border-red-900/20" :
                               "bg-yellow-900/10 text-yellow-400 border-yellow-900/20"
                           )}>
                               <Mail className="w-3 h-3" /> 
                               {incident.emailStatus === 'SENT' ? t('incidenten.email.sent') : 
                                incident.emailStatus === 'FAILED' ? t('incidenten.email.failed') : 
                                t('incidenten.email.sending')}
                           </span>
                       )}
                   </div>
                   <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                       <span className="flex items-center gap-1">
                           {incident.type === 'Complaint' ? <AlertOctagon className="w-3 h-3 text-orange-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                           {incident.type === 'Complaint' ? t('incidenten.types.complaint') : t('incidenten.types.incident')}
                       </span>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                   {/* PDF Actions */}
                   <button 
                        onClick={handleDownloadPdf}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-bold flex items-center gap-2 border border-zinc-700 transition-all"
                        title={t('reports.actions.download')}
                   >
                        <Download className="w-4 h-4" />
                   </button>
                   <button 
                        onClick={handlePrint}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-bold flex items-center gap-2 border border-zinc-700 transition-all mr-2"
                        title={t('reports.actions.print')}
                   >
                        <Printer className="w-4 h-4" />
                   </button>
                   
                   {/* Email Action - Logic consolidated to ensure visibility */}
                   {(!incident.emailStatus || incident.emailStatus === 'NONE' || incident.emailStatus === 'SENT' || incident.emailStatus === 'FAILED') && (
                       <button 
                           onClick={incident.emailStatus === 'FAILED' ? handleRetryEmail : () => setShowEmailModal(true)} 
                           className={clsx(
                               "px-3 py-2 rounded font-bold flex items-center gap-2 border transition-all mr-2",
                               incident.emailStatus === 'FAILED' 
                                   ? "bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-900/50" 
                                   : "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                           )}
                           title={incident.emailStatus === 'FAILED' ? t('incidenten.email.resend') : t('incidenten.email.send')}
                       >
                           {incident.emailStatus === 'FAILED' ? <RefreshCw className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                       </button>
                   )}

                   {/* Review Actions */}
                   {isReviewable && (
                       <>
                           <button onClick={handleApprove} className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                               <CheckCircle className="w-4 h-4" /> <span className="hidden md:inline">{t('reports.actions.approve')}</span>
                           </button>
                           <button onClick={() => setShowRejectModal(true)} className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
                               <XCircle className="w-4 h-4" /> <span className="hidden md:inline">{t('reports.actions.reject')}</span>
                           </button>
                       </>
                   )}
                   
                   {/* Archive Action */}
                   {isArchivable && (
                       <button onClick={handleArchive} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded font-bold flex items-center justify-center gap-2 border border-zinc-700">
                           <Archive className="w-4 h-4" /> <span className="hidden md:inline">{t('incidenten.actions.archive')}</span>
                       </button>
                   )}
                </div>
            </div>
            
            {/* Email Error Banner */}
            {incident.emailStatus === 'FAILED' && incident.emailError && (
                <div className="mt-4 bg-red-900/20 border border-red-900/50 text-red-200 p-2 rounded text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <strong>Fout bij verzenden:</strong> {incident.emailError}
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Description */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-apex-gold" /> {t('incidenten.fields.description')}
                    </h3>
                    <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950/50 p-4 rounded border border-zinc-800">
                        {incident.description}
                    </div>
                </div>

                {/* Photos */}
                {incident.photos.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h3 className="text-white font-bold mb-4">{t('incidenten.fields.photos')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {incident.photos.map((src, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-black" onClick={() => setSelectedImage(src)}>
                                    <img src={src} className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer" alt={`Bewijs ${i}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comments & Log */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-apex-gold" /> {t('incidenten.communication')}
                    </h3>
                    
                    <div className="space-y-6 mb-6">
                        {incident.comments.map(comment => (
                            <div key={comment.id} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs shrink-0 border border-zinc-700 uppercase">
                                    {comment.author.charAt(0)}
                                </div>
                                <div className="flex-1 bg-zinc-950 p-3 rounded-tr-xl rounded-b-xl border border-zinc-800">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-white font-bold text-sm">{comment.author}</span>
                                        <span className="text-zinc-500 text-xs font-mono">{new Date(comment.date).toLocaleString(locale)}</span>
                                    </div>
                                    <p className="text-zinc-300 text-sm">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                        {incident.comments.length === 0 && <p className="text-zinc-600 italic text-sm">Nog geen opmerkingen.</p>}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={t('incidenten.commentPlaceholder')}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-white focus:border-apex-gold outline-none transition-colors"
                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                        />
                        <button onClick={handleAddComment} className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold shadow-lg shadow-apex-gold/10">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar: Audit & Details */}
            <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 sticky top-24">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" /> Tijdlijn
                    </h3>
                    <div className="space-y-4 relative pl-2">
                        <div className="absolute left-[9px] top-2 bottom-2 w-[1px] bg-zinc-800" />
                        {incident.auditLog?.slice().reverse().map((log, i) => (
                            <div key={i} className="relative pl-6">
                                <div className={clsx("absolute left-0 top-1.5 w-[19px] h-[19px] -ml-[0px] border-2 rounded-full z-10 flex items-center justify-center", 
                                    log.action.includes('Rejected') || log.action.includes('Failed') ? "border-red-500 bg-zinc-900" :
                                    log.action.includes('Approved') || log.action.includes('Sent') ? "border-green-500 bg-zinc-900" : "border-zinc-700 bg-zinc-900"
                                )}>
                                    <div className={clsx("w-1.5 h-1.5 rounded-full", 
                                        log.action.includes('Rejected') || log.action.includes('Failed') ? 'bg-red-500' : 
                                        log.action.includes('Approved') || log.action.includes('Sent') ? 'bg-green-500' : 'bg-apex-gold'
                                    )} />
                                </div>
                                <div className="text-sm font-bold text-white capitalize">{log.action.replace(/_/g, ' ')}</div>
                                <div className="text-xs text-zinc-400 font-mono">{new Date(log.date).toLocaleString(locale)}</div>
                                <div className="text-xs text-zinc-500 italic">door {log.user}</div>
                                {log.reason && (
                                    <div className="mt-1 text-xs text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800">
                                        "{log.reason}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Lightbox */}
        {selectedImage && (
            <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                <img src={selectedImage} className="max-w-full max-h-[85vh] rounded shadow-2xl" alt="Preview" onClick={e => e.stopPropagation()} />
                <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedImage(null)}>
                    <XCircle className="w-8 h-8" />
                </button>
            </div>
        )}

        {/* Reject Modal */}
        <FeedbackModal 
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            onConfirm={(reason) => {
                rejectIncident(incident.id, reason);
                setShowRejectModal(false);
            }}
            title={t('reports.actions.reject')}
        />

        {/* Email Modal */}
        <IncidentEmailModal 
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onSend={handleSendEmail}
            defaultRecipients={client?.email ? [client.email] : []}
            defaultSubject={t('incidenten.email.defaultSubject', { title: incident.title })}
        />
    </div>
  );
};
