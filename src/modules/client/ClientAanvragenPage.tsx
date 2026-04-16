import React, { useState } from 'react';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { ServiceType } from '../../data/types';
import { Plus, CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

const SERVICE_TYPES: ServiceType[] = ['Statisch', 'Winkel', 'Werf', 'Event', 'Haven', 'Ziekenhuis', 'Overig'];

export const ClientAanvragenPage: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, locations, shiftRequests, createShiftRequest } = useStore();

  const clientId = user?.clientId || '';
  const client = clients.find(c => c.id === clientId);
  const clientLocs = locations.filter(l => l.clientId === clientId);
  const clientRequests = shiftRequests.filter(r => r.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: '', location: '', serviceType: 'Statisch' as ServiceType, guards: 1, notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.date || !form.location) return;
    createShiftRequest({
      clientId, clientName: client?.name || '',
      date: form.date, location: form.location,
      serviceType: form.serviceType, guards: form.guards, notes: form.notes,
    });
    setForm({ date: '', location: '', serviceType: 'Statisch', guards: 1, notes: '' });
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Aanvragen</h1>
          <p className="text-zinc-400 text-sm mt-1">Vraag een nieuwe beveiligingsdienst aan</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Nieuwe aanvraag
        </button>
      </div>

      {submitted && (
        <div className="bg-emerald-900/20 border border-emerald-700 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-300">Aanvraag ingediend!</p>
            <p className="text-xs text-zinc-400">Wij nemen zo snel mogelijk contact met u op.</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-emerald-800/30 rounded-xl p-6 space-y-5">
          <h2 className="font-black text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" /> Nieuwe dienstaanvraag
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Datum <span className="text-emerald-400">*</span></label>
              <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Type dienst</label>
              <select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none">
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Locatie <span className="text-emerald-400">*</span></label>
            {clientLocs.length > 0 ? (
              <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none">
                <option value="">— Kies locatie —</option>
                {clientLocs.map(l => <option key={l.id} value={l.name}>{l.name} — {l.address}</option>)}
                <option value="__custom">Andere locatie opgeven...</option>
              </select>
            ) : (
              <input type="text" value={form.location} placeholder="Adres of naam van de locatie"
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none" />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Aantal bewakers</label>
            <input type="number" min={1} max={20} value={form.guards}
              onChange={e => setForm({ ...form, guards: parseInt(e.target.value) || 1 })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Opmerkingen / bijzonderheden</label>
            <textarea rows={3} value={form.notes} placeholder="Speciale instructies, tijdstip, toegangsvereisten..."
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={!form.date || !form.location}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition-colors">
              Aanvraag indienen
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg text-sm border border-zinc-700 transition-colors">
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-black text-white mb-4">Historiek ({clientRequests.length})</h2>
        {clientRequests.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
            Nog geen aanvragen ingediend.
          </div>
        ) : (
          <div className="space-y-3">
            {clientRequests.map(r => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-white">{r.location}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{r.serviceType}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {new Date(r.date).toLocaleDateString('nl-BE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      {' · '}{r.guards} bewaker(s)
                    </div>
                    {r.notes && <div className="text-xs text-zinc-500 mt-1 italic">"{r.notes}"</div>}
                    {r.rejectReason && <div className="text-xs text-red-400 mt-1">Reden weigering: {r.rejectReason}</div>}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={clsx("text-xs font-bold uppercase px-2.5 py-1 rounded-full border",
                      r.status === 'Approved' ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800' :
                      r.status === 'Rejected' ? 'text-red-400 bg-red-900/20 border-red-800' :
                      'text-yellow-400 bg-yellow-900/20 border-yellow-800'
                    )}>
                      {r.status === 'Pending' ? 'In behandeling' : r.status === 'Approved' ? 'Goedgekeurd' : 'Geweigerd'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
