import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../data/store';
import { Calendar, Play, ArrowLeft } from 'lucide-react';

export const NieuweFacturatiePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { generateDraftInvoices, shifts } = useStore();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [periodStart, setPeriodStart] = useState(firstDay);
  const [periodEnd, setPeriodEnd] = useState(lastDay);

  const handleGenerate = () => {
      if (!periodStart || !periodEnd) {
          alert(t('facturatie.create.invalidPeriod', { defaultValue: 'Selecteer een geldige periode.' }));
          return;
      }

      const start = new Date(periodStart).getTime();
      const end = new Date(periodEnd).getTime();
      
      const billableShifts = shifts.filter(s =>
          s.status === 'Completed' &&
          !s.invoiceId &&
          new Date(s.startTime).getTime() >= start &&
          new Date(s.startTime).getTime() <= end
      );

      if (billableShifts.length === 0) {
          alert(t('facturatie.create.noShifts', { defaultValue: 'Geen factureerbare shifts gevonden in deze periode.' }));
          return;
      }

      generateDraftInvoices(periodStart, periodEnd);
      navigate('/facturatie/facturen');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/facturatie')}
          className="flex items-center space-x-2 text-apex-gold hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold uppercase tracking-wide text-sm">{t('facturatie.dashboard', { defaultValue: 'Dashboard' })}</span>
        </button>
      </div>
      <div className="max-w-2xl mt-4">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
          {t('facturatie.create.title', { defaultValue: 'Nieuwe facturatieronde' })}
        </h1>
        <p className="text-zinc-400 mb-8">
          {t('facturatie.create.desc', { defaultValue: 'Selecteer een periode om conceptfacturen te genereren op basis van goedgekeurde, nog niet gefactureerde shifts.' })}
        </p>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">{t('facturatie.create.periodStart', { defaultValue: 'Periode Start' })}</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input 
                            type="date" 
                            value={periodStart}
                            onChange={e => setPeriodStart(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white focus:border-apex-gold outline-none w-full transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">{t('facturatie.create.periodEnd', { defaultValue: 'Periode Eind' })}</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input 
                            type="date" 
                            value={periodEnd}
                            onChange={e => setPeriodEnd(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white focus:border-apex-gold outline-none w-full transition-colors"
                        />
                    </div>
                </div>
            </div>

            <button 
              onClick={handleGenerate} 
              className="w-full bg-apex-gold hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-apex-gold/20 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" /> {t('facturatie.create.button', { defaultValue: 'Conceptfacturen genereren' })}
            </button>
        </div>
      </div>
    </div>
  );
};
