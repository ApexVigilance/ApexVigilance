
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, InvoiceStatus } from '../../data/store';
import { Search, FileText, Download, ArrowLeft, Plus } from 'lucide-react';
import clsx from 'clsx';
import { renderInvoicePdf } from './pdfme/renderInvoicePdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';

export const FacturenPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { billingInvoices, clients } = useStore();
  
  const [activeTab, setActiveTab] = useState<InvoiceStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const locale = i18n.language?.startsWith('fr') ? 'fr-BE' : 'nl-BE';

  const filteredInvoices = billingInvoices.filter(inv => {
      const matchesTab = activeTab === 'All' || inv.status === activeTab;
      const q = searchQuery.toLowerCase();
      const matchesSearch = inv.number.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownload = async (e: React.MouseEvent, inv: any) => {
      e.stopPropagation();
      const client = clients.find(c => c.id === inv.clientId);
      try {
        const { blob, filename } = await renderInvoicePdf(inv, client, t);
        downloadPdf(blob, filename);
      } catch (error) {
        console.error("Failed to download PDF:", error);
        alert(t('facturatie.downloadError', { defaultValue: 'Er is een fout opgetreden bij het downloaden van de factuur.' }));
      }
  };

  const TabButton = ({ status, label }: { status: InvoiceStatus | 'All'; label: string }) => (
    <button
      onClick={() => setActiveTab(status)}
      className={clsx(
        "pb-3 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
        activeTab === status 
          ? "border-apex-gold text-white" 
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
      <span className={clsx("text-xs py-0.5 px-2 rounded-full", activeTab === status ? "bg-apex-gold text-black" : "bg-zinc-800 text-zinc-400")}>
        {status === 'All' ? billingInvoices.length : billingInvoices.filter(i => i.status === status).length}
      </span>
    </button>
  );

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 mt-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">{t('facturatie.overviewTitle', { defaultValue: 'Facturenoverzicht' })}</h1>
          <button
            onClick={() => navigate('/facturatie/nieuw')}
            className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-colors shadow shadow-apex-gold/20"
          >
            <Plus className="w-4 h-4" /> Nieuwe Factuur
          </button>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
           <input 
              type="text" 
              placeholder={t('common.search', { defaultValue: 'Zoeken...' })} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-apex-gold outline-none transition-colors"
           />
        </div>
      </div>

      <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto hide-scrollbar">
          <TabButton status="All" label={t('facturatie.tabs.all', { defaultValue: 'Alle' })} />
          <TabButton status="Concept" label={t('facturatie.tabs.concept', { defaultValue: 'Concept' })} />
          <TabButton status="Sent" label={t('facturatie.tabs.sent', { defaultValue: 'Verzonden' })} />
          <TabButton status="Paid" label={t('facturatie.tabs.paid', { defaultValue: 'Betaald' })} />
      </div>

      <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{t('facturatie.emptyList', { defaultValue: 'Geen facturen gevonden.' })}</p>
              </div>
          ) : (
              filteredInvoices.map(inv => (
                  <div 
                      key={inv.id} 
                      onClick={() => navigate(`/facturatie/factuur/${inv.id}`)}
                      className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-apex-gold/30 hover:bg-zinc-900/80 transition-all cursor-pointer group"
                  >
                      <div className="flex items-start sm:items-center gap-4">
                          <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center border shrink-0",
                              inv.status === 'Paid' ? "bg-green-900/20 border-green-900/50 text-green-500" :
                              inv.status === 'Sent' ? "bg-blue-900/20 border-blue-900/50 text-blue-500" :
                              "bg-zinc-800 border-zinc-700 text-zinc-400"
                          )}>
                              <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                              <div className="font-bold text-white text-base sm:text-lg truncate">{inv.number}</div>
                              <div className="text-xs text-zinc-400 truncate">{inv.clientName} • {new Date(inv.date).toLocaleDateString(locale)}</div>
                          </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-800 sm:border-0">
                          <div className="flex items-center gap-3 sm:hidden">
                              <span className={clsx("px-2 py-1 rounded text-[10px] font-bold uppercase border", 
                                  inv.status === 'Paid' ? "bg-green-900/20 text-green-500 border-green-900/50" :
                                  inv.status === 'Sent' ? "bg-blue-900/20 text-blue-500 border-blue-900/50" :
                                  "bg-zinc-800 text-zinc-400 border-zinc-700"
                              )}>
                                  {t(`facturatie.status.${inv.status}`)}
                              </span>
                          </div>
                          <div className="text-right hidden sm:block">
                              <div className="text-lg font-mono text-apex-gold">€ {inv.totalIncl.toFixed(2)}</div>
                              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Incl. BTW</div>
                          </div>
                          <span className={clsx("hidden sm:inline-block px-3 py-1 rounded text-xs font-bold uppercase border", 
                              inv.status === 'Paid' ? "bg-green-900/20 text-green-500 border-green-900/50" :
                              inv.status === 'Sent' ? "bg-blue-900/20 text-blue-500 border-blue-900/50" :
                              "bg-zinc-800 text-zinc-400 border-zinc-700"
                          )}>
                              {t(`facturatie.status.${inv.status}`)}
                          </span>
                          <div className="flex items-center gap-4 sm:hidden">
                              <div className="text-right">
                                  <div className="text-base font-mono text-apex-gold">€ {inv.totalIncl.toFixed(2)}</div>
                              </div>
                          </div>
                          <button 
                              onClick={(e) => handleDownload(e, inv)}
                              className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-800 rounded-lg sm:bg-transparent sm:hover:bg-transparent"
                          >
                              <Download className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
