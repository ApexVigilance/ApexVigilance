import React, { useState } from 'react';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { Building2, Mail, Phone, MapPin, Hash, FileText, Users, Edit2, Save, X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const inputClass = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-2 focus:ring-[#7170ff]/20 transition-all placeholder:text-zinc-600';
const labelClass = 'block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5';

export const ClientProfielPage: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, locations, updateClient } = useStore();

  const clientId = user?.clientId || '';
  const client = clients.find(c => c.id === clientId);
  const clientLocs = locations.filter(l => l.clientId === clientId);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    contact: client?.contact || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    billingAddress: client?.billingAddress || '',
  });
  const [editSuccess, setEditSuccess] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  if (!client) return <div className="p-8 text-zinc-400">Klantprofiel niet gevonden.</div>;

  const startEdit = () => {
    setEditForm({
      contact: client.contact || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      billingAddress: client.billingAddress || '',
    });
    setIsEditing(true);
    setEditSuccess(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = () => {
    updateClient(clientId, {
      contact: editForm.contact,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
      billingAddress: editForm.billingAddress || undefined,
    });
    setIsEditing(false);
    setEditSuccess(true);
    setTimeout(() => setEditSuccess(false), 3000);
  };

  const handlePasswordChange = () => {
    setPassError('');
    setPassSuccess(false);
    if (!passForm.current) { setPassError('Vul uw huidig wachtwoord in.'); return; }
    if (passForm.current !== (client.portalPassword || '')) { setPassError('Huidig wachtwoord is incorrect.'); return; }
    if (passForm.new.length < 6) { setPassError('Nieuw wachtwoord moet minimaal 6 tekens bevatten.'); return; }
    if (passForm.new !== passForm.confirm) { setPassError('Wachtwoorden komen niet overeen.'); return; }
    updateClient(clientId, { portalPassword: passForm.new });
    setPassForm({ current: '', new: '', confirm: '' });
    setPassSuccess(true);
    setTimeout(() => setPassSuccess(false), 3000);
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) =>
    value ? (
      <div className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
        <Icon className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
          <div className="text-sm text-white mt-0.5">{value}</div>
        </div>
      </div>
    ) : null;

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Profiel</h1>
        <p className="text-zinc-400 text-sm mt-1">Uw bedrijfsgegevens en contactinformatie</p>
      </div>

      {/* Company card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
              <Building2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{client.name}</h2>
              {client.clientRef && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold mt-0.5">
                  <Hash className="w-3 h-3" /> {client.clientRef}
                </div>
              )}
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium transition-all shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" /> Bewerken
            </button>
          ) : (
            <div className="flex gap-2 shrink-0">
              <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs transition-all">
                <X className="w-3.5 h-3.5" /> Annuleren
              </button>
              <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium transition-all">
                <Save className="w-3.5 h-3.5" /> Opslaan
              </button>
            </div>
          )}
        </div>

        {editSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-emerald-400 mb-4">
            <CheckCircle2 className="w-4 h-4" /> Gegevens opgeslagen.
          </div>
        )}

        {!isEditing ? (
          <>
            <InfoRow icon={Users} label="Contactpersoon" value={client.contact} />
            <InfoRow icon={Mail} label="E-mail" value={client.email} />
            <InfoRow icon={Phone} label="Telefoon" value={client.phone} />
            <InfoRow icon={MapPin} label="Adres" value={client.address} />
            {client.billingAddress && <InfoRow icon={MapPin} label="Factuuradres" value={client.billingAddress} />}
            <InfoRow icon={FileText} label="BTW-nummer" value={client.vat} />
            {client.contractNumber && <InfoRow icon={FileText} label="Contractnummer" value={client.contractNumber} />}
            {client.paymentTerms && <InfoRow icon={FileText} label="Betalingstermijn" value={`${client.paymentTerms} dagen`} />}
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Contactpersoon</label>
              <input className={inputClass} value={editForm.contact} onChange={e => setEditForm(f => ({ ...f, contact: e.target.value }))} placeholder="Naam contactpersoon" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>E-mailadres</label>
                <input type="email" className={inputClass} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="info@bedrijf.be" />
              </div>
              <div>
                <label className={labelClass}>Telefoon</label>
                <input type="tel" className={inputClass} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+32 2 xxx xx xx" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Adres</label>
              <input className={inputClass} value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Straat 1, 1000 Brussel" />
            </div>
            <div>
              <label className={labelClass}>Factuuradres (optioneel)</label>
              <input className={inputClass} value={editForm.billingAddress} onChange={e => setEditForm(f => ({ ...f, billingAddress: e.target.value }))} placeholder="Zelfde als adres indien leeg" />
            </div>
            <p className="text-xs text-zinc-600">Bedrijfsnaam, BTW-nummer en contractgegevens worden beheerd door Apex Vigilance.</p>
          </div>
        )}
      </div>

      {/* Locaties */}
      {clientLocs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-black text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Uw locaties ({clientLocs.length})
          </h3>
          <div className="space-y-3">
            {clientLocs.map(loc => (
              <div key={loc.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{loc.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{loc.address}, {loc.city}</div>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{loc.type}</span>
                </div>
                {loc.accessInfo && (
                  <div className="text-xs text-zinc-500 mt-2 italic">"{loc.accessInfo}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wachtwoord wijzigen */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-black text-white mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#7170ff]" /> Wachtwoord wijzigen
        </h3>

        {passError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {passError}
          </div>
        )}
        {passSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-emerald-400 mb-4">
            <CheckCircle2 className="w-4 h-4" /> Wachtwoord gewijzigd.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Huidig wachtwoord</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={`${inputClass} pr-10`}
                value={passForm.current}
                onChange={e => { setPassForm(f => ({ ...f, current: e.target.value })); setPassError(''); }}
                placeholder="Huidig wachtwoord"
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Nieuw wachtwoord</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                className={`${inputClass} pr-10`}
                value={passForm.new}
                onChange={e => { setPassForm(f => ({ ...f, new: e.target.value })); setPassError(''); }}
                placeholder="Minimaal 6 tekens"
              />
              <button type="button" onClick={() => setShowNewPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Bevestig nieuw wachtwoord</label>
            <input
              type="password"
              className={inputClass}
              value={passForm.confirm}
              onChange={e => { setPassForm(f => ({ ...f, confirm: e.target.value })); setPassError(''); }}
              placeholder="Herhaal nieuw wachtwoord"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            className="flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
          >
            <KeyRound className="w-4 h-4" /> Wachtwoord wijzigen
          </button>
        </div>
      </div>
    </div>
  );
};
