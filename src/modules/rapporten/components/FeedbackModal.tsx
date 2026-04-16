
import React, { useState } from 'react';
import { X, MessageSquare, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.length >= 10) {
      onConfirm(reason);
      setReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-apex-gold" />
          {title || t('feedback.titleFallback')}
        </h3>
        
        <p className="text-zinc-400 text-sm mb-4">
          {t('feedback.description')}
        </p>

        <textarea 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white h-32 focus:border-apex-gold outline-none resize-none mb-2"
          placeholder={t('feedback.placeholder')}
          autoFocus
        />
        
        <div className="flex justify-end gap-2 text-xs text-zinc-500 mb-4">
          <span className={reason.length < 10 ? "text-red-500" : "text-green-500"}>
            {reason.length} / 10 {t('feedback.chars')}
          </span>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleSubmit}
            disabled={reason.length < 10}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded transition-colors shadow-lg shadow-red-900/20"
          >
            {t('common.save')}
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
