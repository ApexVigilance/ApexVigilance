import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { BackButton } from '../../ui/BackButton';
import { generateClientPdf } from './utils/generateClientPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';
import {
  Building, MapPin, Phone, Mail, FileText, Download, Printer,
  Hash, Edit3, Save, X, Plus, AlertTriangle,
  Calendar, Clock, Euro, Shield, Users, ChevronRight,
  ClipboardList, StickyNote, KeyRound, Eye, EyeOff
} from 'lucide-react';
import clsx from 'clsx';
import { FullClient } from '../../data/types';

// ── Portaal credentials component ──────────────────────
const ClientPortalCredentials: React.FC<{
  client: FullClient;
  updateClient: (id: string, u: Partial<FullClient>) => void;
  clientId: string;
}> = ({ client, updateClient, clientId }) => {
  const [username, setUsername] = useState(client.portalUsername || client.clientRef || client.email || '');
  const [password, setPassword] = useState(client.portalPassword || '');
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateClient(clientId, { portalUsername: username.trim(), portalPassword: password.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
      <div>
        <h3 className="font-black text-white text-lg flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-400" /> Klantportaal toegang
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Stel de inloggegevens in waarmee <strong className="text-white">{client.name}</strong> kan inloggen in het klantportaal.
        </p>
      </div>

      {client.portalPassword && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg px-4 py-3 text-sm">
          <p className="text-emerald-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Portaal actief
          </p>
          <p className="text-zinc-400 mt-1 text-xs">
            Klant logt in met: <span className="font-mono text-white">{client.portalUsername}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Gebruikersnaam</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder={client.clientRef || client.email || 'gebruikersnaam'}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none" />
          <p className="text-[10px] text-zinc-600 mt-1">Standaard: klantref of e-mailadres</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Wachtwoord</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Wachtwoord instellen"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 pr-10 text-white text-sm focus:border-emerald-500 outline-none" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={!username || !password}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors">
        <Save className="w-4 h-4" /> {saved ? 'Opgeslagen ✓' : 'Toegang opslaan'}
      </button>

      {client.portalPassword && (
        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4 text-xs text-zinc-500 space-y-1">
          <p className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-2">Inloggegevens doorgeven aan klant</p>
          <p>URL: <span className="font-mono text-zinc-300">{window.location.origin}/#/login</span></p>
          <p>Gebruikersnaam: <span className="font-mono text-zinc-300">{client.portalUsername}</span></p>
          <p>Wachtwoord: <span className="font-mono text-zinc-300">{showPass ? client.portalPassword : '••••••••'}</span></p>
        </div>
      )}
    </div>
  );
};

type Tab = 'overzicht' | 'profiel' | 'locaties' | 'shifts' | 'facturen' | 'incidenten' | 'rapporten' | 'portaal' | 'notities';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    Inactive: 'bg-red-900/30 text-red-400 border-red-800',
    Scheduled: 'bg-blue-900/30 text-blue-400 border-blue-800',
    Completed: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    Approved: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    Submitted: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    Paid: 'bg-blue-900/30 text-blue-400 border-blue-800',
    Sent: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    Concept: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    Draft: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    Overdue: 'bg-red-900/30 text-red-400 border-red-800',
    High: 'bg-red-900/30 text-red-400 border-red-800',
    Critical: 'bg-red-900/20 text-red-300 border-red-900',
    Medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    Low: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };
  return clsx('px-2 py-0.5 rounded text-xs font-bold uppercase border', map[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700');
};

export const KlantDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, locations, billingInvoices, shifts, incidents, reports, updateClient } = useStore();

  const client = clients.find(c => c.id === id);
  const clientLocs = locations.filter(l => l.clientId === id);
  const clientShifts = shifts.filter(s => s.clientId === id || s.clientName === client?.name).sort((a, b) => b.startTime.localeCompare(a.startTime));
  const clientInvoices = billingInvoices.filter(i => i.clientId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const clientIncidents = incidents.filter(i => i.clientId === id || clientLocs.some(l => l.id === i.locationId)).sort((a, b) => b.date.localeCompare(a.date));
  const clientReports = reports.filter(r => (r as any).clientId === id || clientShifts.some(s => s.id === (r as any).shiftId)).sort((a, b) => b.date.localeCompare(a.date));

  const [activeTab, setActiveTab] = useState<Tab>('overzicht');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<typeof client>>({});

  if (!client) return <div className="p-8 text-white">Klant niet gevonden.</div>;

  // Stats
  const openInvoicesTotal = clientInvoices.filter(i => i.status === 'Sent' || i.status === 'Concept').reduce((s, i) => s + i.totalIncl, 0);
  const activeShifts = clientShifts.filter(s => s.status === 'Scheduled' || s.status === 'Active').length;
  const openIncidents = clientIncidents.filter(i => i.status === 'Submitted' || i.status === 'Draft').length;
  const contractExpiring = client.contractEnd && new Date(client.contractEnd) < new Date(Date.now() + 30 * 86400000);

  const startEdit = () => { setForm({ ...client }); setEditMode(true); };
  const cancelEdit = () => { setEditMode(false); setForm({}); };
  const saveEdit = () => {
    if (form) { updateClient(id!, form); }
    setEditMode(false);
  };

  const handleDownloadDossier = () => {
    const { blob, filename } = generateClientPdf(client, clientLocs);
    downloadPdf(blob, filename);
  };
  const handlePrintDossier = () => {
    const { blob } = generateClientPdf(client, clientLocs);
    printPdfBlob(blob);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overzicht', label: 'Overzicht', icon: <Building className="w-4 h-4" /> },
    { id: 'profiel', label: 'Profiel', icon: <Users className="w-4 h-4" /> },
    { id: 'locaties', label: 'Locaties', icon: <MapPin className="w-4 h-4" />, count: clientLocs.length },
    { id: 'shifts', label: 'Shifts', icon: <Clock className="w-4 h-4" />, count: clientShifts.length },
    { id: 'facturen', label: 'Facturen', icon: <Euro className="w-4 h-4" />, count: clientInvoices.length },
    { id: 'incidenten', label: 'Incidenten', icon: <AlertTriangle className="w-4 h-4" />, count: clientIncidents.length },
    { id: 'rapporten', label: 'Rapporten', icon: <ClipboardList className="w-4 h-4" />, count: clientReports.length },
    { id: 'portaal', label: 'Portaal toegang', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'notities', label: 'Notities', icon: <StickyNote className="w-4 h-4" /> },
  ];

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <BackButton />

      {/* ── Header ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-zinc-950 rounded-xl flex items-center justify-center text-apex-gold border border-zinc-800 shadow-lg flex-shrink-0">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">{client.name}</h1>
                <span className={statusBadge(client.status)}>
                  {client.status === 'Active' ? 'Actief' : 'Inactief'}
                </span>
                {contractExpiring && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase border bg-orange-900/30 text-orange-400 border-orange-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Contract verloopt
                  </span>
                )}
              </div>
              {client.clientRef && (
                <div className="text-sm font-bold text-apex-gold flex items-center gap-1 mb-2">
                  <Hash className="w-3.5 h-3.5" /> {client.clientRef}
                  {client.contractNumber && <span className="text-zinc-500 font-normal ml-3">Contract: {client.contractNumber}</span>}
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-600" />{client.address}</span>}
                {client.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-zinc-600" />{client.email}</span>}
                {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-zinc-600" />{client.phone}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button onClick={() => navigate(`/facturatie/nieuw?clientId=${id}`)}
              className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-all">
              <Plus className="w-4 h-4" /> Nieuwe Factuur
            </button>
            <button onClick={handleDownloadDossier}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm transition-colors">
              <Download className="w-4 h-4" /> Dossier
            </button>
            <button onClick={handlePrintDossier}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm transition-colors">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-apex-gold">€{openInvoicesTotal.toFixed(0)}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Openstaand</div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 text-center">
            <div className="text-lg font-black text-blue-400">{activeShifts}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Actieve shifts</div>
          </div>
          <div className={clsx("border rounded-lg p-3 text-center", openIncidents > 0 ? "bg-red-950/30 border-red-900/40" : "bg-zinc-950/60 border-zinc-800")}>
            <div className={clsx("text-lg font-black", openIncidents > 0 ? "text-red-400" : "text-emerald-400")}>{openIncidents}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Open incidenten</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-zinc-800 mb-6 gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={clsx("flex items-center gap-1.5 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all",
              activeTab === tab.id ? "border-apex-gold text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
            {tab.icon} {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                activeTab === tab.id ? "bg-apex-gold text-black" : "bg-zinc-800 text-zinc-400")}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Overzicht ── */}
      {activeTab === 'overzicht' && (
        <div className="space-y-6">
          {/* Recent shifts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-apex-gold" /> Recente shifts</h3>
              <button onClick={() => setActiveTab('shifts')} className="text-xs text-apex-gold hover:text-yellow-400 flex items-center gap-1">Alle shifts <ChevronRight className="w-3 h-3" /></button>
            </div>
            {clientShifts.slice(0, 4).length === 0 ? (
              <p className="text-zinc-500 text-sm">Geen shifts gevonden.</p>
            ) : (
              <div className="space-y-2">
                {clientShifts.slice(0, 4).map(s => (
                  <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{s.location}</div>
                      <div className="text-xs text-zinc-500">{new Date(s.startTime).toLocaleDateString('nl-BE', { day:'2-digit', month:'short', year:'numeric' })} · {s.employeeId || 'Niet toegewezen'}</div>
                    </div>
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent invoices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Euro className="w-4 h-4 text-apex-gold" /> Recente facturen</h3>
              <button onClick={() => setActiveTab('facturen')} className="text-xs text-apex-gold hover:text-yellow-400 flex items-center gap-1">Alle facturen <ChevronRight className="w-3 h-3" /></button>
            </div>
            {clientInvoices.slice(0, 3).length === 0 ? (
              <p className="text-zinc-500 text-sm">Geen facturen gevonden.</p>
            ) : (
              <div className="space-y-2">
                {clientInvoices.slice(0, 3).map(inv => (
                  <div key={inv.id} onClick={() => navigate(`/facturatie/${inv.id}`)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">{inv.number}</div>
                      <div className="text-xs text-zinc-500">{inv.date} · Vervalt {inv.dueDate}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-apex-gold">€{inv.totalIncl.toFixed(2)}</span>
                      <span className={statusBadge(inv.status)}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent incidents */}
          {clientIncidents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Recente incidenten</h3>
                <button onClick={() => setActiveTab('incidenten')} className="text-xs text-apex-gold hover:text-yellow-400 flex items-center gap-1">Alle <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-2">
                {clientIncidents.slice(0, 3).map(inc => (
                  <div key={inc.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{inc.title}</div>
                      <div className="text-xs text-zinc-500">{inc.date}</div>
                    </div>
                    <span className={statusBadge(inc.severity)}>{inc.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Profiel ── */}
      {activeTab === 'profiel' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-white text-lg">Klantprofiel & Contract</h3>
            {!editMode ? (
              <button onClick={startEdit} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm transition-colors">
                <Edit3 className="w-4 h-4" /> Bewerken
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-all">
                  <Save className="w-4 h-4" /> Opslaan
                </button>
                <button onClick={cancelEdit} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm transition-colors">
                  <X className="w-4 h-4" /> Annuleren
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Bedrijfsgegevens</p>
              {[
                { label: 'Bedrijfsnaam', key: 'name', type: 'text' },
                { label: 'BTW-nummer', key: 'vat', type: 'text' },
                { label: 'Contactpersoon', key: 'contact', type: 'text' },
                { label: 'E-mail', key: 'email', type: 'email' },
                { label: 'Telefoon', key: 'phone', type: 'tel' },
                { label: 'Adres', key: 'address', type: 'text' },
                { label: 'Facturatieadres', key: 'billingAddress', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{label}</label>
                  {editMode ? (
                    <input type={type} value={(form as any)[key] || ''}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none transition-all" />
                  ) : (
                    <p className="text-sm text-white bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5">{(client as any)[key] || <span className="text-zinc-600 italic">Niet ingevuld</span>}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Contract & Facturatie</p>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contractnummer</label>
                {editMode ? (
                  <input type="text" value={form?.contractNumber || ''}
                    onChange={e => setForm({ ...form, contractNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
                ) : (
                  <p className="text-sm text-white bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5">{client.contractNumber || <span className="text-zinc-600 italic">Niet ingevuld</span>}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contract van</label>
                  {editMode ? (
                    <input type="date" value={form?.contractStart || ''}
                      onChange={e => setForm({ ...form, contractStart: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
                  ) : (
                    <p className="text-sm text-white bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5">{client.contractStart || <span className="text-zinc-600 italic">—</span>}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contract tot</label>
                  {editMode ? (
                    <input type="date" value={form?.contractEnd || ''}
                      onChange={e => setForm({ ...form, contractEnd: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
                  ) : (
                    <p className={clsx("text-sm bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5", contractExpiring ? "text-orange-400 font-bold" : "text-white")}>
                      {client.contractEnd || <span className="text-zinc-600 italic">—</span>}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Betalingstermijn</label>
                {editMode ? (
                  <select value={form?.paymentTerms || 30}
                    onChange={e => setForm({ ...form, paymentTerms: Number(e.target.value) as any })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none">
                    {[15, 30, 45, 60].map(d => <option key={d} value={d}>{d} dagen</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-white bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5">{client.paymentTerms ? `${client.paymentTerms} dagen` : <span className="text-zinc-600 italic">30 dagen (standaard)</span>}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Uurtarief (€)</label>
                {editMode ? (
                  <input type="number" step="0.01" value={form?.hourlyRate || ''}
                    onChange={e => setForm({ ...form, hourlyRate: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
                ) : (
                  <p className="text-sm text-white bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5 font-mono">{client.hourlyRate ? `€ ${client.hourlyRate.toFixed(2)}/u` : <span className="text-zinc-600 italic">Niet ingesteld</span>}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Locaties ── */}
      {activeTab === 'locaties' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg">{clientLocs.length} locatie(s)</h3>
            <button onClick={() => navigate(`/klanten/locaties?clientId=${id}`)}
              className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-all">
              <Plus className="w-4 h-4" /> Locatie beheren
            </button>
          </div>
          {clientLocs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Geen locaties gekoppeld.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientLocs.map(loc => (
                <div key={loc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white">{loc.name}</h4>
                      <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{loc.address}, {loc.city}</p>
                    </div>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{loc.type}</span>
                  </div>
                  {loc.accessInfo && (
                    <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
                      <Shield className="w-3.5 h-3.5 inline mr-1.5 text-apex-gold" />
                      {loc.accessInfo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Shifts ── */}
      {activeTab === 'shifts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg">{clientShifts.length} shift(s)</h3>
            <button onClick={() => navigate('/planning')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm transition-colors">
              <Calendar className="w-4 h-4" /> Planning
            </button>
          </div>
          {clientShifts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Geen shifts gevonden.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Datum</th>
                    <th className="px-5 py-3 text-left">Locatie</th>
                    <th className="px-5 py-3 text-left">Agent</th>
                    <th className="px-5 py-3 text-left">Tijd</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {clientShifts.map(s => (
                    <tr key={s.id} onClick={() => navigate(`/shifts/${s.id}`)}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer">
                      <td className="px-5 py-3 text-zinc-300 whitespace-nowrap">{new Date(s.startTime).toLocaleDateString('nl-BE', { day:'2-digit', month:'short' })}</td>
                      <td className="px-5 py-3 text-white font-medium">{s.location}</td>
                      <td className="px-5 py-3 text-zinc-400">{s.employeeId || '—'}</td>
                      <td className="px-5 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                        {new Date(s.startTime).toLocaleTimeString('nl-BE', { hour:'2-digit', minute:'2-digit' })} – {new Date(s.endTime).toLocaleTimeString('nl-BE', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="px-5 py-3 text-center"><span className={statusBadge(s.status)}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Facturen ── */}
      {activeTab === 'facturen' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg">{clientInvoices.length} factuur/facturen · Openstaand: <span className="text-apex-gold">€{openInvoicesTotal.toFixed(2)}</span></h3>
            <button onClick={() => navigate(`/facturatie/nieuw?clientId=${id}`)}
              className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-all">
              <Plus className="w-4 h-4" /> Nieuwe Factuur
            </button>
          </div>
          {clientInvoices.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Geen facturen gevonden.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Nummer</th>
                    <th className="px-5 py-3 text-left">Datum</th>
                    <th className="px-5 py-3 text-left">Vervaldatum</th>
                    <th className="px-5 py-3 text-right">Bedrag</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {clientInvoices.map(inv => (
                    <tr key={inv.id} onClick={() => navigate(`/facturatie/${inv.id}`)}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer">
                      <td className="px-5 py-3 font-bold text-white">{inv.number}</td>
                      <td className="px-5 py-3 text-zinc-300">{inv.date}</td>
                      <td className="px-5 py-3 text-zinc-300">{inv.dueDate}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-apex-gold">€{inv.totalIncl.toFixed(2)}</td>
                      <td className="px-5 py-3 text-center"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Incidenten ── */}
      {activeTab === 'incidenten' && (
        <div>
          <h3 className="font-black text-white text-lg mb-4">{clientIncidents.length} incident(en)</h3>
          {clientIncidents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Geen incidenten gevonden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientIncidents.map(inc => (
                <div key={inc.id} onClick={() => navigate(`/incidenten/${inc.id}`)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-zinc-700 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold text-white">{inc.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{inc.date} · {inc.type || 'Incident'}</div>
                    {inc.description && <div className="text-xs text-zinc-400 mt-1 line-clamp-1">{inc.description}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={statusBadge(inc.severity)}>{inc.severity}</span>
                    <span className={statusBadge(inc.status)}>{inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Rapporten ── */}
      {activeTab === 'rapporten' && (
        <div>
          <h3 className="font-black text-white text-lg mb-4">{clientReports.length} rapport(en)</h3>
          {clientReports.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Geen rapporten gevonden.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Datum</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Auteur</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {clientReports.map(r => (
                    <tr key={r.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3 text-zinc-300">{r.date}</td>
                      <td className="px-5 py-3 text-white font-medium">{r.type}</td>
                      <td className="px-5 py-3 text-zinc-400">{r.author}</td>
                      <td className="px-5 py-3 text-center"><span className={statusBadge(r.status)}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Portaal toegang ── */}
      {activeTab === 'portaal' && (
        <ClientPortalCredentials client={client} updateClient={updateClient} clientId={id!} />
      )}

      {/* ── Tab: Notities ── */}
      {activeTab === 'notities' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg flex items-center gap-2"><StickyNote className="w-5 h-5 text-apex-gold" /> Interne notities</h3>
            {!editMode ? (
              <button onClick={startEdit} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm transition-colors">
                <Edit3 className="w-4 h-4" /> Bewerken
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="bg-apex-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> Opslaan
                </button>
                <button onClick={cancelEdit} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 text-sm">
                  <X className="w-4 h-4" /> Annuleren
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 mb-3">Enkel zichtbaar voor admins. Niet opgenomen in facturen of rapporten.</p>
          {editMode ? (
            <textarea rows={10} value={form?.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Interne opmerkingen, speciale afspraken, prioriteiten..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-white text-sm focus:border-apex-gold outline-none resize-none transition-all" />
          ) : (
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4 text-sm text-zinc-300 min-h-[200px] whitespace-pre-wrap">
              {client.notes || <span className="text-zinc-600 italic">Geen notities.</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
