import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { useAuthStore } from '../auth/store';
import { EmptyState } from '../../ui/EmptyState';
import { Search, Inbox, ShieldAlert, CheckCircle2, ChevronRight, Download, Printer, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { generatePersoneelListPdf } from './utils/generatePersoneelPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';
import { Employee } from '../../data/types';

const ROLE_LABELS: Record<string, string> = {
  'Guard': 'Bewaker',
  'Senior': 'Senior Bewaker',
  'Supervisor': 'Verantwoordelijke',
  'PlanningMaster': 'Planningmeester',
  'Coordinator': 'Coördinator',
  'Admin': 'Administratie',
};

const ROLE_COLORS: Record<string, string> = {
  'Guard': 'bg-zinc-900 border-zinc-700 text-zinc-400',
  'Senior': 'bg-blue-900/30 border-blue-700/50 text-blue-400',
  'Supervisor': 'bg-orange-900/30 border-orange-700/50 text-orange-400',
  'PlanningMaster': 'bg-purple-900/30 border-purple-700/50 text-purple-400',
  'Coordinator': 'bg-cyan-900/30 border-cyan-700/50 text-cyan-400',
  'Admin': 'bg-green-900/30 border-green-700/50 text-green-400',
};

const LANGUAGES = ['NL', 'FR', 'EN', 'DE'];

const emptyForm = {
  firstName: '',
  lastName: '',
  role: 'Guard' as Employee['role'],
  email: '',
  phone: '',
  address: '',
  portalUsername: '',
  portalPassword: '',
  languages: [] as string[],
  status: 'Active' as 'Active' | 'Inactive',
};

export const PersoneelPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employees, addEmployee } = useStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Review' | 'BadgeAlert'>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasPendingItems = (e: any) =>
    e.personalInfoStatus === 'PENDING' ||
    e.idCardStatus === 'PENDING' ||
    e.badgeDataStatus === 'PENDING';

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.badgeNr && emp.badgeNr.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    const now = new Date();
    const expiryDate = emp.badgeExpiry ? new Date(emp.badgeExpiry) : null;
    const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const isBadgeAlert = expiryDate ? daysToExpiry < 60 : false;
    switch (activeFilter) {
      case 'Active': return emp.status === 'Active';
      case 'Review': return hasPendingItems(emp);
      case 'BadgeAlert': return isBadgeAlert && emp.status === 'Active';
      default: return true;
    }
  }).sort((a, b) => {
    const aPending = hasPendingItems(a);
    const bPending = hasPendingItems(b);
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    if (!a.badgeExpiry) return 1;
    if (!b.badgeExpiry) return -1;
    return new Date(a.badgeExpiry).getTime() - new Date(b.badgeExpiry).getTime();
  });

  const handleDownload = () => {
    const { blob, filename } = generatePersoneelListPdf(filteredEmployees, activeFilter);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generatePersoneelListPdf(filteredEmployees, activeFilter);
    printPdfBlob(blob);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    addEmployee({
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role,
      status: form.status,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      portalUsername: form.portalUsername.trim() || undefined,
      portalPassword: form.portalPassword.trim() || undefined,
      languages: form.languages.length > 0 ? form.languages : undefined,
    });
    setSaving(false);
    setShowCreate(false);
    setForm(emptyForm);
  };

  const toggleLanguage = (lang: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const FilterButton = ({ filter, label, icon: Icon, count }: { filter: typeof activeFilter, label: string, icon?: any, count?: number }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5",
        activeFilter === filter
          ? "bg-apex-gold text-black border-apex-gold shadow-md"
          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {count !== undefined && count > 0 && (
        <span className={clsx("ml-1 px-1.5 rounded-full text-[9px]", activeFilter === filter ? "bg-black text-white" : "bg-zinc-700 text-zinc-300")}>{count}</span>
      )}
    </button>
  );

  const pendingCount = employees.filter(e => hasPendingItems(e)).length;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('personeel.title')}</h2>
          <p className="text-zinc-400 mt-1">{t('personeel.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-[#5e6ad2] hover:bg-[#7170ff] text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Nieuw profiel
              </button>
            )}
            <button
              onClick={handleDownload}
              className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
            >
              <Printer className="w-4 h-4" /> Afdrukken
            </button>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-apex-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
        <FilterButton filter="All" label="Alle" />
        <FilterButton filter="Active" label="Actief" icon={CheckCircle2} />
        <div className="w-px h-6 bg-zinc-800 mx-1"></div>
        <FilterButton filter="Review" label="Te Beoordelen" icon={Inbox} count={pendingCount} />
        <FilterButton filter="BadgeAlert" label="Badge Verloop" icon={ShieldAlert} />
        <div className="ml-auto text-xs text-zinc-500 font-mono hidden md:block px-2">
          {filteredEmployees.length} resultaten
        </div>
      </div>

      {/* List */}
      {filteredEmployees.length === 0 ? <EmptyState message="Geen personeelsleden gevonden." /> : (
        <div className="grid gap-3">
          {filteredEmployees.map(emp => {
            const now = new Date();
            const expiryDate = emp.badgeExpiry ? new Date(emp.badgeExpiry) : null;
            const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
            const isExpired = daysToExpiry < 0;
            const isCritical = daysToExpiry >= 0 && daysToExpiry < 15;
            const isWarning = daysToExpiry >= 15 && daysToExpiry < 60;
            const isPending = hasPendingItems(emp);
            const isActive = emp.status === 'Active';
            const roleBadgeClass = ROLE_COLORS[emp.role] || ROLE_COLORS['Guard'];
            const roleLabel = ROLE_LABELS[emp.role] || emp.role;

            return (
              <div
                key={emp.id}
                onClick={() => navigate(`/personeel/${emp.id}`)}
                className={clsx(
                  "bg-zinc-900 border p-4 pt-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all cursor-pointer group relative overflow-hidden",
                  isActive ? "hover:border-apex-gold hover:shadow-lg" : "opacity-70 grayscale-[0.5]",
                  isPending ? "border-orange-500/50 bg-orange-900/5" : "border-zinc-800"
                )}
              >
                <div className={clsx("absolute left-0 top-0 bottom-0 w-1",
                  isPending ? "bg-orange-500" :
                  isExpired ? "bg-red-600" : isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : isActive ? "bg-green-600" : "bg-zinc-600"
                )} />

                <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full sm:w-auto mt-1 pl-2">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-apex-gold font-bold text-lg border border-zinc-700 shadow-inner shrink-0 relative">
                    {emp.name.charAt(0)}
                    {emp.badgePhotoUrl && (
                      <img src={emp.badgePhotoUrl} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                    )}
                    {isPending && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-zinc-900" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-apex-gold transition-colors truncate">{emp.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span className={clsx("uppercase px-1.5 py-0.5 rounded text-[10px] tracking-wide font-bold border", roleBadgeClass)}>{roleLabel}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-mono text-zinc-500">{emp.badgeNr || 'Geen Badge'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                  <div className="flex gap-2">
                    {isPending && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-orange-950 text-orange-500 px-2 py-1 rounded border border-orange-900">
                        <Inbox className="w-3 h-3" /> TE BEOORDELEN
                      </span>
                    )}
                    {isExpired && isActive && !isPending && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-950 text-red-500 px-2 py-1 rounded border border-red-900">
                        <ShieldAlert className="w-3 h-3" /> VERLOPEN
                      </span>
                    )}
                    {isCritical && isActive && !isPending && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-900/40 text-red-500 px-2 py-1 rounded border border-red-900 animate-pulse">
                        <ShieldAlert className="w-3 h-3" /> DRINGEND
                      </span>
                    )}
                    {isWarning && isActive && !isPending && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-yellow-900/20 text-yellow-500 px-2 py-1 rounded border border-yellow-900/30">
                        <ShieldAlert className="w-3 h-3" /> BINNENKORT
                      </span>
                    )}
                  </div>

                  <div className={clsx("px-3 py-1 rounded text-xs font-bold uppercase tracking-wider min-w-[80px] text-center hidden sm:block",
                    emp.status === 'Active' ? 'bg-zinc-950 text-zinc-400 border border-zinc-800' : 'bg-red-900/10 text-red-900 border border-red-900/20'
                  )}>
                    {emp.status === 'Active' ? 'Actief' : 'Inactief'}
                  </div>

                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1011] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-lg font-bold text-white">Nieuw profiel aanmaken</h3>
              <button onClick={() => { setShowCreate(false); setForm(emptyForm); }} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Voornaam *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                    placeholder="Voornaam"
                    className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Achternaam *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    required
                    placeholder="Achternaam"
                    className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Rol *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Employee['role'] }))}
                  className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff]"
                >
                  <option value="Guard">Bewaker</option>
                  <option value="Senior">Senior Bewaker</option>
                  <option value="Supervisor">Verantwoordelijke</option>
                  <option value="PlanningMaster">Planningmeester</option>
                  <option value="Coordinator">Coördinator</option>
                  <option value="Admin">Administratie</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@voorbeeld.be"
                    className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Telefoon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+32 ..."
                    className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Adres</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Straat, Gemeente"
                  className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                />
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Portaal toegang (optioneel)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-600 mb-1">Gebruikersnaam</label>
                    <input
                      type="text"
                      value={form.portalUsername}
                      onChange={e => setForm(f => ({ ...f, portalUsername: e.target.value }))}
                      placeholder="gebruikersnaam"
                      className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-600 mb-1">Wachtwoord</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.portalPassword}
                        onChange={e => setForm(f => ({ ...f, portalPassword: e.target.value }))}
                        placeholder="wachtwoord"
                        className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 pr-9 text-white text-sm outline-none focus:border-[#7170ff] focus:ring-1 focus:ring-[#7170ff]/20"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Talen</label>
                <div className="flex gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        form.languages.includes(lang)
                          ? "bg-[#5e6ad2] border-[#7170ff] text-white"
                          : "bg-zinc-900 border-white/8 text-zinc-500 hover:border-white/20"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Status</label>
                <div className="flex gap-2">
                  {(['Active', 'Inactive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={clsx(
                        "px-4 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        form.status === s
                          ? s === 'Active' ? "bg-green-900/30 border-green-600 text-green-400" : "bg-red-900/30 border-red-600 text-red-400"
                          : "bg-zinc-900 border-white/8 text-zinc-500 hover:border-white/20"
                      )}
                    >
                      {s === 'Active' ? 'Actief' : 'Inactief'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/[0.04] transition-all"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={!form.firstName.trim() || !form.lastName.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#5e6ad2] hover:bg-[#7170ff] disabled:opacity-40 text-white text-sm font-bold transition-all"
                >
                  {saving ? 'Opslaan...' : 'Profiel aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
