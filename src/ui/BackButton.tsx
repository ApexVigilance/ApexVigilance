import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button 
      onClick={() => navigate(-1)}
      className="flex items-center space-x-2 text-apex-gold hover:text-white transition-colors mb-4"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-semibold uppercase tracking-wide text-sm">{t('common.back')}</span>
    </button>
  );
};