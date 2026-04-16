import React, { useState } from 'react';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export const ClientIncidentenPage: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, incidents, locations, createIncident } = useStore() as any;

  const clientId = user?.clientId || '';
  const client = clients.find((c: any) => c.id === clientId);
  const clientLocs = locations.filter((l: any) => l.clientId === clientId);
  const clientIncidents = incidents
    .filter((i: any) => i.clientId === clientId || clientLocs.some((l: any) => l.id === i.locationId))
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'Medium' as any });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.title) return;
    if (typeof createIncident === 'function') {
      createIncident({
        id: `INC-${Date.now()}`,
        title: form.title,
        description: form.description,
        severity: form.severity,
        date: new Date().toISOString().split('T')[0],
        status: 'Submitted',
        type: 'Incident',
        clientId,
        photos: [], comments: [],
        auditLog: [{ date: new Date().toISOString(), action: 'Gemeld door klant', user: client?.name || 'Klant' }],
      });
    }
    setForm({ title: '', description: '', severity: 'Medium' });
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const severityStyle: Record<string, string> = {
    Low: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    Medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800',
    High: 'text-orange-400 bg-orange-900/20 border-orange-800',
    Critical: 'text-red-400 bg-red-900/20 border-red-800',
  };

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Incidenten</h1>
          <p className="text-zinc-400 text-sm mt-1">Meld een incident of bekijk de historiek</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Incident melden
        </button>
      </div>

      {submitted && (
        <div className="bg-emerald-900/20 border border-emerald-700 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300 font-bold">Incident gemeld — wij nemen contact op.</p>
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-6 space-y-4">
          <h2 className="font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Nieuw incident melden
          </h2>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Titel <span className="text-red-400">*</span></label>
            <input type="text" value={form.title} placeholder="Korte omschrijving van het incident"
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Ernst</label>
            <div className="flex gap-2 flex-wrap">
              {['Low', 'Medium', 'High', 'Critical'].map(sev => (
                <button key={sev} onClick={() => setForm({ ...form, severity: sev })}
                  className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                    form.severity === sev ? severityStyle[sev] : 'text-zinc-500 border-zinc-700 hover:border-zinc-600')}>
                  {sev}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Beschrijving</label>
            <textarea rows={4} value={form.description} placeholder="Gedetailleerde beschrijving van wat er is voorgevallen..."
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={!form.title}
              className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3 rounded-lg text-sm transition-colors">
              Versturen
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg text-sm border border-zinc-700">
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-black text-white mb-4">Historiek ({clientIncidents.length})</h2>
        {clientIncidents.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            Geen incidenten gevonden.
          </div>
        ) : (
          <div className="space-y-3">
            {clientIncidents.map((inc: any) => (
              <div key={inc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{inc.title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{inc.date}</div>
                    {inc.description && <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{inc.description}</div>}
                  </div>
                  <span className={clsx("text-xs font-bold uppercase px-2.5 py-1 rounded border flex-shrink-0",
                    severityStyle[inc.severity] || 'text-zinc-400 bg-zinc-800 border-zinc-700')}>
                    {inc.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
