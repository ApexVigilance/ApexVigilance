
import React, { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IncidentEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string[], subject: string, message: string) => void;
  defaultRecipients?: string[];
  defaultSubject?: string;
}

export const IncidentEmailModal: React.FC<IncidentEmailModalProps> = ({ 
  isOpen, onClose, onSend, defaultRecipients = [], defaultSubject = '' 
}) => {
  const { t } = useTranslation();
  const [to, setTo] = useState(defaultRecipients.join(', '));
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject) return;
    
    setIsSending(true);
    const recipients = to.split(',').map(e => e.trim()).filter(e => e);
    await onSend(recipients, subject, message);
    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-apex-gold" /> {t('incidenten.email.sendTitle')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
              {t('incidenten.email.recipients')} <span className="text-zinc-600 font-normal">{t('incidenten.email.commaSeparated')}</span>
            </label>
            <input 
              type="text" 
              value={to} 
              onChange={e => setTo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold outline-none"
              placeholder={t('incidenten.email.placeholder')}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
              {t('incidenten.email.subject')}
            </label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
              {t('incidenten.email.message')} <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold outline-none h-24 resize-none"
              placeholder={t('incidenten.email.messagePlaceholder')}
            />
          </div>

          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full" /> {t('incidenten.email.attachmentInfo')}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit"
              disabled={isSending || !to}
              className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg disabled:opacity-50 transition-all"
            >
              {isSending ? t('incidenten.email.sending') : <><Send className="w-4 h-4" /> {t('incidenten.email.send')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
