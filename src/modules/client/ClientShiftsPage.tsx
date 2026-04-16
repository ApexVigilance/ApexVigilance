import React, { useState } from 'react';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { Clock, Calendar } from 'lucide-react';
import clsx from 'clsx';

export const ClientShiftsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, shifts, locations } = useStore();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  const clientId = user?.clientId || '';
  const client = clients.find(c => c.id === clientId);
  const allShifts = shifts
    .filter(s => s.clientId === clientId || s.clientName === client?.name)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  const now = new Date();
  const filtered = allShifts.filter(s => {
    if (filter === 'upcoming') return new Date(s.startTime) >= now;
    if (filter === 'completed') return s.status === 'Completed' || s.status === 'Approved';
    return true;
  });

  const statusStyle: Record<string, string> = {
    Scheduled: 'text-blue-400 bg-blue-900/20 border-blue-800',
    Active: 'text-emerald-400 bg-emerald-900/20 border-emerald-800',
    Completed: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    Approved: 'text-emerald-400 bg-emerald-900/20 border-emerald-800',
    Cancelled: 'text-red-400 bg-red-900/20 border-red-800',
  };

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Shifts & Diensten</h1>
        <p className="text-zinc-400 text-sm mt-1">Overzicht van uw geplande en uitgevoerde bewaking</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-0">
        {[['upcoming', 'Aankomend'], ['completed', 'Afgerond'], ['all', 'Alle']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as any)}
            className={clsx("px-4 py-2.5 text-sm font-bold border-b-2 transition-all",
              filter === val ? "border-emerald-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
          Geen shifts gevonden.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">{s.location}</div>
                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.startTime).toLocaleDateString('nl-BE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.startTime).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(s.endTime).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {s.serviceType && <span className="text-zinc-500">{s.serviceType}</span>}
                  </div>
                </div>
                <span className={clsx("text-xs font-bold uppercase px-2.5 py-1 rounded border flex-shrink-0",
                  statusStyle[s.status] || 'text-zinc-400 bg-zinc-800 border-zinc-700')}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
