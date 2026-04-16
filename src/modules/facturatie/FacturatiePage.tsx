import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import {
  FileText, Download, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Send, Euro, ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

export const FacturatiePage: React.FC = () => {
  const navigate = useNavigate();
  const { billingInvoices, shifts, clients } = useStore();

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const conceptInvoices  = billingInvoices.filter(i => i.status === 'Concept');
  const sentInvoices     = billingInvoices.filter(i => i.status === 'Sent');
  const paidThisMonth    = billingInvoices.filter(i => i.status === 'Paid' && i.paidAt && new Date(i.paidAt) >= startOfMonth);
  const overdueInvoices  = sentInvoices.filter(i => new Date(i.dueDate) < now);

  const openstaandBedrag = sentInvoices.reduce((s, i) => s + i.totalIncl, 0);
  const betaaldMaand     = paidThisMonth.reduce((s, i) => s + i.totalIncl, 0);
  const totaalOmzet      = billingInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalIncl, 0);

  // Clients with uninvoiced completed shifts
  const billableShiftsByClient = clients
    .filter(c => c.status === 'Active')
    .map(client => {
      const uninvoiced = shifts.filter(s =>
        s.status === 'Completed' &&
        !s.invoiceId &&
        (s.clientId === client.id || s.clientName === client.name)
      );
      return { client, count: uninvoiced.length };
    })
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const recentInvoices = [...billingInvoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const fmt = (n: number) =>
    n.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusStyle = (status: string) => clsx(
    'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
    status === 'Paid'    ? 'bg-green-900/20 text-green-400 border-green-900/40' :
    status === 'Sent'    ? 'bg-blue-900/20 text-blue-400 border-blue-900/40' :
    status === 'Concept' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : ''
  );

  const statusLabel = (s: string) =>
    s === 'Paid' ? 'Betaald' : s === 'Sent' ? 'Verzonden' : 'Concept';

  return (
    <div className="animate-in fade-in duration-300 pb-20 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Facturatie</h2>
          <p className="text-zinc-400 mt-1 text-sm">Beheer facturen, betalingen en klantenfacturatie</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/facturatie/nieuw')}
            className="bg-apex-gold hover:bg-yellow-500 text-black px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-apex-gold/20"
          >
            <Plus className="w-4 h-4" /> Nieuwe Factuur
          </button>
          <button
            onClick={() => navigate('/facturatie/facturen')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-colors"
          >
            <FileText className="w-4 h-4" /> Alle Facturen
          </button>
          <button
            onClick={() => navigate('/facturatie/export')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Openstaand', value: `€ ${fmt(openstaandBedrag)}`, sub: `${sentInvoices.length} factuur/facturen`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/10 border-blue-900/30' },
          { label: 'Achterstallig', value: overdueInvoices.length.toString(), sub: overdueInvoices.length > 0 ? 'Vervaldag verstreken' : 'Alles op tijd', icon: AlertCircle, color: overdueInvoices.length > 0 ? 'text-red-400' : 'text-green-400', bg: overdueInvoices.length > 0 ? 'bg-red-900/10 border-red-900/30' : 'bg-green-900/10 border-green-900/30' },
          { label: 'Betaald deze maand', value: `€ ${fmt(betaaldMaand)}`, sub: `${paidThisMonth.length} factuur/facturen`, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-900/10 border-green-900/30' },
          { label: 'Totale omzet', value: `€ ${fmt(totaalOmzet)}`, sub: 'Alle tijden (betaald)', icon: TrendingUp, color: 'text-apex-gold', bg: 'bg-apex-gold/5 border-apex-gold/20' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={clsx('rounded-xl border p-5 relative overflow-hidden', bg)}>
            <Icon className={clsx('w-5 h-5 mb-3', color)} />
            <div className="text-2xl font-black text-white leading-tight">{value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-bold uppercase tracking-wide">{label}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Klanten met openstaande shifts */}
      {billableShiftsByClient.length > 0 && (
        <div className="bg-amber-900/10 border border-amber-700/40 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-white">
                {billableShiftsByClient.length} klant{billableShiftsByClient.length > 1 ? 'en' : ''} {billableShiftsByClient.length > 1 ? 'hebben' : 'heeft'} goedgekeurde shifts klaar voor facturatie
              </div>
              <div className="text-xs text-zinc-400">Klik op een klant om direct een factuur aan te maken</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {billableShiftsByClient.map(({ client, count }) => (
              <button
                key={client.id}
                onClick={() => navigate(`/facturatie/nieuw?clientId=${client.id}`)}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-700 hover:border-apex-gold/50 rounded-lg px-4 py-3 text-left transition-all group"
              >
                <div>
                  <div className="font-bold text-white text-sm group-hover:text-apex-gold transition-colors">{client.name}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{count} shift{count > 1 ? 's' : ''} klaar voor facturatie</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">{count}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-apex-gold transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recente facturen */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">Recente facturen</h3>
          {billingInvoices.length > 6 && (
            <button onClick={() => navigate('/facturatie/facturen')} className="text-apex-gold text-sm font-bold flex items-center gap-1 hover:text-white transition-colors">
              Alle facturen <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentInvoices.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <Euro className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-500 font-medium">Nog geen facturen aangemaakt</p>
            <p className="text-zinc-600 text-sm mt-1">Klik op "Nieuwe Factuur" om te beginnen</p>
            <button
              onClick={() => navigate('/facturatie/nieuw')}
              className="mt-4 bg-apex-gold text-black px-5 py-2 rounded-lg font-bold text-sm hover:bg-yellow-500 transition-colors"
            >
              Eerste factuur aanmaken
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => navigate(`/facturatie/factuur/${inv.id}`)}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer transition-all group hover:bg-zinc-800/60"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center border shrink-0',
                    inv.status === 'Paid' ? 'bg-green-900/20 border-green-900/40 text-green-400' :
                    inv.status === 'Sent' ? 'bg-blue-900/20 border-blue-900/40 text-blue-400' :
                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                  )}>
                    {inv.status === 'Paid' ? <CheckCircle2 className="w-4 h-4" /> :
                     inv.status === 'Sent' ? <Send className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm">{inv.number}</div>
                    <div className="text-xs text-zinc-400 truncate">{inv.clientName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={statusStyle(inv.status)}>{statusLabel(inv.status)}</span>
                  <div className="text-right hidden sm:block">
                    <div className="font-mono font-bold text-apex-gold text-sm">€ {fmt(inv.totalIncl)}</div>
                    <div className="text-[10px] text-zinc-500">
                      {new Date(inv.date).toLocaleDateString('nl-BE')}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
