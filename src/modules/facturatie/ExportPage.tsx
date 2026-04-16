
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../data/store';
import { Download, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExportPage: React.FC = () => {
  const { t } = useTranslation();
  const { billingInvoices } = useStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const handleExport = () => {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Number.MAX_SAFE_INTEGER;

      const filtered = billingInvoices.filter(inv => {
          const d = new Date(inv.date).getTime();
          return d >= start && d <= end;
      });

      if (filtered.length === 0) {
          alert('Geen facturen gevonden voor deze periode.');
          return;
      }

      // Generate CSV
      const headers = ['Nummer', 'Klant', 'Datum', 'Vervaldatum', 'Subtotaal', 'BTW', 'Totaal', 'Status', 'OGM'];
      const rows = filtered.map(inv => [
          inv.number,
          inv.clientName,
          new Date(inv.date).toLocaleDateString(),
          new Date(inv.dueDate).toLocaleDateString(),
          inv.subtotalExcl.toFixed(2),
          inv.vatTotal.toFixed(2),
          inv.totalIncl.toFixed(2),
          inv.status,
          inv.ogm || ''
      ]);

      const csvContent = [
          headers.join(';'),
          ...rows.map(r => r.join(';'))
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Export_Facturatie_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-20 animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/facturatie')}
            className="flex items-center space-x-2 text-apex-gold hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">{t('facturatie.dashboard', { defaultValue: 'Dashboard' })}</span>
          </button>
        </div>

        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{t('facturatie.export.title')}</h1>
        <p className="text-zinc-400 mb-8">{t('facturatie.export.desc')}</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-2xl">
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('facturatie.export.from')}</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-white focus:border-apex-gold outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('facturatie.export.to')}</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-white focus:border-apex-gold outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-8">
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-zinc-400">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-white font-bold text-sm">CSV Formaat</div>
                    <div className="text-zinc-500 text-xs">Compatibel met Excel, Exact, etc.</div>
                </div>
            </div>

            <button 
                onClick={handleExport}
                className="w-full bg-apex-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-apex-gold/20 transition-all"
            >
                <Download className="w-5 h-5" /> {t('facturatie.export.download')}
            </button>
        </div>
    </div>
  );
};
