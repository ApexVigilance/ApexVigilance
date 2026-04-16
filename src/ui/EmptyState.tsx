import React from 'react';
import { useTranslation } from 'react-i18next';

export const EmptyState: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/50">
      <div className="text-apex-muted mb-2">{message || t('common.soon')}</div>
    </div>
  );
};