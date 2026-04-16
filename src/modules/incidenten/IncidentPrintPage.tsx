
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const IncidentPrintPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
        navigate(`/incidenten/${id}`);
    } else {
        navigate('/incidenten');
    }
  }, [id, navigate]);

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center p-8 text-center font-mono">
      <div className="max-w-md">
          <h1 className="text-xl font-bold mb-4 text-apex-gold">{t('print.deprecated.title')}</h1>
          <p className="text-zinc-400">
              {t('print.deprecated.desc')}
          </p>
      </div>
    </div>
  );
};
