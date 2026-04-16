
import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const KlantenPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
        navigate(`/klanten/${id}`);
    } else {
        navigate('/klanten');
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
