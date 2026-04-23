import React, { useState } from 'react';
import { Shield, Building2, CheckCircle2, XCircle, Clock, UserPlus, ChevronRight, X } from 'lucide-react';
import { useStore } from '../../data/store';
import { PendingRegistration, RegistrationStatus } from '../../data/types';
import { useNavigate } from 'react-router-dom';

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED';

const TAB_LABELS: Record<Tab, string> = {
  PENDING: 'Openstaand',
  APPROVED: 'Goedgekeurd',
  REJECTED: 'Afgewezen',
};

const StatusBadge: React.FC<{ status: RegistrationStatus }> = ({ status }) => {
  if (status === 'PENDING') return <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Openstaand</span>;
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Goedgekeurd</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Afgewezen</span>;
};

const TypeBadge: React.FC<{ type: PendingRegistration['type'] }> = ({ type }) => {
  if (type === 'agent') return <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#5e6ad2]/15 text-[#7170ff] px-2 py-0.5 rounded-full"><Shield className="w-3 h-3" /> Agent</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full"><Building2 className="w-3 h-3" /> Klant</span>;
};

export const RegistratiesPage: React.FC = () => {
  const { pendingRegistrations, reviewPendingRegistration } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('PENDING');
  const [rejectDialog, setRejectDialog] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<PendingRegistration | null>(null);

  const filtered = pendingRegistrations.filter(r => r.status === activeTab);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleApprove = (reg: PendingRegistration) => {
    reviewPendingRegistration(reg.id, 'APPROVE');
    setSelected(null);
    const dest = reg.type === 'agent' ? '/personeel' : '/klanten';
    const label = reg.type === 'agent' ? 'Medewerker aangemaakt' : 'Klant aangemaakt';
    showToast(`${label}. Stel portaalcredentials in via ${reg.type === 'agent' ? 'Personeel' : 'Klanten'}.`);
    setTimeout(() => navigate(dest), 2500);
  };

  const handleRejectConfirm = () => {
    if (!rejectDialog) return;
    reviewPendingRegistration(rejectDialog.id, 'REJECT', rejectReason.trim() || undefined);
    setRejectDialog(null);
    setRejectReason('');
    setSelected(null);
    showToast('Aanvraag afgewezen.');
  };

  const getName = (r: PendingRegistration) =>
    r.type === 'agent' ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : r.companyName || '—';

  const pendingCount = pendingRegistrations.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-200 max-w-sm">
          {toast}
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">Aanvraag afwijzen</h3>
            <p className="text-sm text-zinc-400 mb-4">{rejectDialog.name}</p>
            <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Reden (optioneel)</label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50 resize-none"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Voer een reden in..."
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setRejectDialog(null); setRejectReason(''); }} className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors">Annuleren</button>
              <button onClick={handleRejectConfirm} className="flex-1 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors">Afwijzen</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <TypeBadge type={selected.type} />
                <StatusBadge status={selected.status} />
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              {selected.type === 'agent' ? (
                <>
                  <DetailRow label="Naam" value={`${selected.firstName || ''} ${selected.lastName || ''}`.trim()} />
                  <DetailRow label="E-mail" value={selected.email} />
                  <DetailRow label="Telefoon" value={selected.phone} />
                  {selected.address && <DetailRow label="Adres" value={selected.address} />}
                  {selected.languages?.length ? <DetailRow label="Talen" value={selected.languages.join(', ')} /> : null}
                  {selected.motivation && <DetailRow label="Motivatie" value={selected.motivation} />}
                </>
              ) : (
                <>
                  <DetailRow label="Bedrijf" value={selected.companyName || '—'} />
                  <DetailRow label="Contactpersoon" value={selected.contactPerson || '—'} />
                  <DetailRow label="E-mail" value={selected.email} />
                  <DetailRow label="Telefoon" value={selected.phone} />
                  {selected.address && <DetailRow label="Adres" value={selected.address} />}
                  {selected.vat && <DetailRow label="BTW" value={selected.vat} />}
                  {selected.message && <DetailRow label="Bericht" value={selected.message} />}
                </>
              )}
              <DetailRow label="Ingediend op" value={new Date(selected.submittedAt).toLocaleString('nl-BE')} />
              {selected.reviewedAt && <DetailRow label="Beoordeeld op" value={new Date(selected.reviewedAt).toLocaleString('nl-BE')} />}
              {selected.rejectionReason && <DetailRow label="Reden afwijzing" value={selected.rejectionReason} />}
            </div>
            {selected.status === 'PENDING' && (
              <div className="flex gap-2 p-5 border-t border-zinc-800">
                <button
                  onClick={() => { setRejectDialog({ id: selected.id, name: getName(selected) }); }}
                  className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
                >
                  Afwijzen
                </button>
                <button
                  onClick={() => handleApprove(selected)}
                  className="flex-1 py-2.5 rounded-xl bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-sm font-medium transition-colors"
                >
                  Goedkeuren
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#7170ff]" />
            Registraties
            {pendingCount > 0 && (
              <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Beoordeel aanvragen van agenten en klanten.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 p-1 rounded-xl w-fit">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => {
          const count = pendingRegistrations.filter(r => r.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-[#5e6ad2] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center">
          <UserPlus className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Geen {TAB_LABELS[activeTab].toLowerCase()} aanvragen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(reg => (
            <button
              key={reg.id}
              onClick={() => setSelected(reg)}
              className="w-full flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${reg.type === 'agent' ? 'bg-[#5e6ad2]/15' : 'bg-emerald-500/15'}`}>
                {reg.type === 'agent' ? <Shield className="w-5 h-5 text-[#7170ff]" /> : <Building2 className="w-5 h-5 text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{getName(reg)}</span>
                  <TypeBadge type={reg.type} />
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">{reg.email} · {reg.phone}</div>
                <div className="text-xs text-zinc-600 mt-0.5">
                  {new Date(reg.submittedAt).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={reg.status} />
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
    <div className="text-sm text-white mt-0.5 whitespace-pre-wrap">{value}</div>
  </div>
);
