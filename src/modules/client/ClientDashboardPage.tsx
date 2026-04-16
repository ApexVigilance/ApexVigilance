import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { Clock, Euro, AlertTriangle, CalendarCheck, ChevronRight, CheckCircle, XCircle, Calendar } from 'lucide-react';
import clsx from 'clsx';

export const ClientDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, shifts, billingInvoices, incidents, shiftRequests, locations } = useStore();
  const navigate = useNavigate();

  const clientId = user?.clientId || '';
  const client = clients.find(c => c.id === clientId);
  const clientShifts = shifts.filter(s => s.clientId === clientId || s.clientName === client?.name);
  const clientInvoices = billingInvoices.filter(i => i.clientId === clientId);
  const clientLocs = locations.filter(l => l.clientId === clientId);
  const clientIncidents = incidents.filter(i => i.clientId === clientId || clientLocs.some(l => l.id === i.locationId));
  const clientRequests = shiftRequests.filter(r => r.clientId === clientId);

  const today = new Date().toDateString();
  const todayShifts = clientShifts.filter(s => new Date(s.startTime).toDateString() === today);
  const openInvoices = clientInvoices.filter(i => i.status === 'Sent' || i.status === 'Concept');
  const openInvoicesTotal = openInvoices.reduce((s, i) => s + i.totalIncl, 0);
  const openIncidents = clientIncidents.filter(i => i.status === 'Submitted' || i.status === 'Draft');
  const pendingRequests = clientRequests.filter(r => r.status === 'Pending');
  const upcomingShifts = clientShifts
    .filter(s => new Date(s.startTime) > new Date() && (s.status === 'Scheduled' || s.status === 'Active'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 4);

  const statusColor = (status: string) => {
    const m: Record<string, string> = {
      Scheduled: 'text-blue-400', Active: 'text-emerald-400', Completed: 'text-zinc-400',
      Approved: 'text-emerald-400', Pending: 'text-yellow-400', Rejected: 'text-red-400',
    };
    return m[status] || 'text-zinc-400';
  };

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Welkom, <span className="text-emerald-400">{client?.name || user?.username}</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Overzicht van uw beveiligingsdiensten</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/client/shifts')}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-blue-700/50 transition-all group">
          <Clock className="w-5 h-5 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-2xl font-black text-white">{todayShifts.length}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Shifts vandaag</div>
        </button>

        <button onClick={() => navigate('/client/facturen')}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-emerald-700/50 transition-all group">
          <Euro className="w-5 h-5 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-2xl font-black text-white font-mono">€{openInvoicesTotal.toFixed(0)}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Openstaand</div>
        </button>

        <button onClick={() => navigate('/client/incidenten')}
          className={clsx("bg-zinc-900 border rounded-xl p-5 text-left transition-all group",
            openIncidents.length > 0 ? "border-red-800/50 hover:border-red-700" : "border-zinc-800 hover:border-zinc-700")}>
          <AlertTriangle className={clsx("w-5 h-5 mb-3 group-hover:scale-110 transition-transform", openIncidents.length > 0 ? "text-red-400" : "text-zinc-500")} />
          <div className={clsx("text-2xl font-black", openIncidents.length > 0 ? "text-red-400" : "text-white")}>{openIncidents.length}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Open incidenten</div>
        </button>

        <button onClick={() => navigate('/client/aanvragen')}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-yellow-700/50 transition-all group">
          <CalendarCheck className="w-5 h-5 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-2xl font-black text-white">{pendingRequests.length}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Aanvragen in behandeling</div>
        </button>
      </div>

      {/* Upcoming shifts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" /> Komende diensten
          </h2>
          <button onClick={() => navigate('/client/shifts')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Alle shifts <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {upcomingShifts.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            Geen geplande diensten.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingShifts.map(s => (
              <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{s.location}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {new Date(s.startTime).toLocaleDateString('nl-BE', { weekday: 'long', day: '2-digit', month: 'long' })}
                    {' · '}
                    {new Date(s.startTime).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(s.endTime).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className={clsx("text-xs font-bold uppercase", statusColor(s.status))}>{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent requests */}
      {clientRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-yellow-400" /> Recente aanvragen
            </h2>
            <button onClick={() => navigate('/client/aanvragen')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Alle aanvragen <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {clientRequests.slice(0, 3).map(r => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{r.location} · {r.serviceType}</div>
                  <div className="text-xs text-zinc-500">{new Date(r.date).toLocaleDateString('nl-BE')} · {r.guards} bewaker(s)</div>
                </div>
                <span className={clsx("text-xs font-bold uppercase px-2 py-1 rounded border",
                  r.status === 'Approved' ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800' :
                  r.status === 'Rejected' ? 'text-red-400 bg-red-900/20 border-red-800' :
                  'text-yellow-400 bg-yellow-900/20 border-yellow-800'
                )}>{r.status === 'Pending' ? 'In behandeling' : r.status === 'Approved' ? 'Goedgekeurd' : 'Geweigerd'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick action */}
      <div className="bg-emerald-900/10 border border-emerald-800/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white">Nieuwe dienst aanvragen?</h3>
          <p className="text-sm text-zinc-400 mt-0.5">Dien een aanvraag in en wij plannen uw bewaking.</p>
        </div>
        <button onClick={() => navigate('/client/aanvragen')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors flex-shrink-0">
          Aanvraag indienen
        </button>
      </div>
    </div>
  );
};
