import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { FileText, Euro, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export const ClientFacturenPage: React.FC = () => {
  const { user } = useAuthStore();
  const { billingInvoices } = useStore();
  const navigate = useNavigate();

  const clientId = user?.clientId || '';
  const invoices = billingInvoices
    .filter(i => i.clientId === clientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openTotal = invoices.filter(i => i.status === 'Sent' || i.status === 'Concept').reduce((s, i) => s + i.totalIncl, 0);
  const paidTotal = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalIncl, 0);

  const statusStyle: Record<string, string> = {
    Paid: 'text-blue-400 bg-blue-900/20 border-blue-800',
    Sent: 'text-emerald-400 bg-emerald-900/20 border-emerald-800',
    Concept: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    Overdue: 'text-red-400 bg-red-900/20 border-red-800',
  };
  const statusLabel: Record<string, string> = {
    Paid: 'Betaald', Sent: 'Openstaand', Concept: 'Concept', Overdue: 'Achterstallig',
  };

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Facturen</h1>
        <p className="text-zinc-400 text-sm mt-1">Uw facturatiehistoriek</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <Clock className="w-5 h-5 text-yellow-400 mb-3" />
          <div className="text-2xl font-black text-white font-mono">€{openTotal.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Openstaand</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
          <div className="text-2xl font-black text-white font-mono">€{paidTotal.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Betaald totaal</div>
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
          Geen facturen gevonden.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Nummer</th>
                <th className="px-5 py-3 text-left">Datum</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Vervaldatum</th>
                <th className="px-5 py-3 text-right">Bedrag</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/client/facturen/${inv.id}`)}>
                  <td className="px-5 py-3 font-bold text-white">{inv.number}</td>
                  <td className="px-5 py-3 text-zinc-300">{new Date(inv.date).toLocaleDateString('nl-BE')}</td>
                  <td className="px-5 py-3 text-zinc-300 hidden sm:table-cell">{new Date(inv.dueDate).toLocaleDateString('nl-BE')}</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">€{inv.totalIncl.toFixed(2)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={clsx("text-xs font-bold uppercase px-2.5 py-1 rounded border",
                      statusStyle[inv.status] || 'text-zinc-400 bg-zinc-800 border-zinc-700')}>
                      {statusLabel[inv.status] || inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
