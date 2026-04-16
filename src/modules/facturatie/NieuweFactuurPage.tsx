import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, InvoiceLine } from '../../data/store';
import {
  ArrowLeft, Users, FileText, Plus, Trash2, ChevronRight,
  CheckSquare, Square, AlertCircle, Calculator, PenLine
} from 'lucide-react';
import clsx from 'clsx';

type Mode = 'shifts' | 'handmatig';

const recalcLine = (l: Partial<InvoiceLine> & { quantity: number; unitPrice: number; vatRate: number }): InvoiceLine => {
  const totalExcl  = Number((l.quantity * l.unitPrice).toFixed(2));
  const vatAmount  = Number((totalExcl * l.vatRate / 100).toFixed(2));
  const totalIncl  = Number((totalExcl + vatAmount).toFixed(2));
  return { description: l.description || '', quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate, totalExcl, vatAmount, totalIncl };
};

export const NieuweFactuurPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { shifts, clients, createInvoiceForClient, createManualInvoice, pricingConfig } = useStore();

  const preselectedClientId = searchParams.get('clientId');
  const [mode, setMode] = useState<Mode>(preselectedClientId ? 'shifts' : 'shifts');

  // ── MODE: VAN SHIFTS ──────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [step, setStep] = useState<'client' | 'shifts'>(preselectedClientId ? 'shifts' : 'client');

  // Clients with uninvoiced completed shifts
  const billableClients = clients
    .filter(c => c.status === 'Active')
    .map(client => {
      const uninvoiced = shifts.filter(s =>
        s.status === 'Completed' && !s.invoiceId &&
        (s.clientId === client.id || s.clientName === client.name)
      );
      return { client, shifts: uninvoiced };
    })
    .filter(r => r.shifts.length > 0);

  const clientShifts = billableClients.find(r => r.client.id === selectedClientId)?.shifts || [];

  useEffect(() => {
    if (preselectedClientId) {
      setSelectedClientId(preselectedClientId);
      setStep('shifts');
    }
  }, [preselectedClientId]);

  useEffect(() => {
    // Auto-select all shifts when client is chosen
    setSelectedShiftIds(clientShifts.map(s => s.id));
  }, [selectedClientId]);

  const toggleShift = (id: string) =>
    setSelectedShiftIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreateFromShifts = () => {
    if (!selectedClientId || selectedShiftIds.length === 0) return;
    (createInvoiceForClient as any)(selectedClientId, selectedShiftIds);
    navigate('/facturatie/facturen');
  };

  // ── MODE: HANDMATIG ───────────────────────────────────────────────
  const [manualClientId, setManualClientId] = useState('');
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  const [lines, setLines] = useState<InvoiceLine[]>([
    recalcLine({ description: 'Bewakingsdiensten', quantity: 1, unitPrice: 0, vatRate: pricingConfig.vatRate || 21 })
  ]);

  const addLine = () =>
    setLines(prev => [...prev, recalcLine({ description: '', quantity: 1, unitPrice: 0, vatRate: pricingConfig.vatRate || 21 })]);

  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof InvoiceLine, value: string | number) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: typeof value === 'string' && field !== 'description' ? parseFloat(value) || 0 : value };
      return recalcLine(updated);
    }));
  };

  const manualSubtotal = lines.reduce((s, l) => s + l.totalExcl, 0);
  const manualVat      = lines.reduce((s, l) => s + l.vatAmount, 0);
  const manualTotal    = manualSubtotal + manualVat;

  const handleCreateManual = () => {
    if (!manualClientId || lines.length === 0) return;
    (createManualInvoice as any)(manualClientId, periodStart, periodEnd, lines);
    navigate('/facturatie/facturen');
  };

  const fmt = (n: number) => n.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="pb-20 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/facturatie')} className="flex items-center gap-2 text-apex-gold hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-wide">
        <ArrowLeft className="w-4 h-4" /> Facturatie
      </button>

      <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Nieuwe Factuur</h2>
      <p className="text-zinc-400 text-sm mb-8">Maak een factuur aan op basis van gewerkte shifts of voeg lijnen handmatig in.</p>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8 max-w-md">
        {([
          { key: 'shifts', label: 'Op basis van shifts', icon: Users },
          { key: 'handmatig', label: 'Handmatig', icon: PenLine },
        ] as { key: Mode; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all',
              mode === key ? 'bg-apex-gold text-black shadow' : 'text-zinc-400 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── VAN SHIFTS ── */}
      {mode === 'shifts' && (
        <div>
          {billableClients.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p className="text-zinc-400 font-medium">Geen klanten met openstaande shifts</p>
              <p className="text-zinc-500 text-sm mt-1">
                Shifts moeten de status "Voltooid" hebben en nog niet gefactureerd zijn.<br/>
                Of maak een handmatige factuur aan.
              </p>
              <button onClick={() => setMode('handmatig')} className="mt-4 text-apex-gold text-sm font-bold hover:underline">
                Handmatige factuur aanmaken →
              </button>
            </div>
          ) : step === 'client' ? (
            /* STAP 1: klant kiezen */
            <div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                Stap 1 van 2 — Selecteer klant
              </div>
              <div className="space-y-3">
                {billableClients.map(({ client, shifts: cShifts }) => (
                  <button
                    key={client.id}
                    onClick={() => { setSelectedClientId(client.id); setStep('shifts'); }}
                    className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-apex-gold/50 rounded-xl px-5 py-4 transition-all group text-left"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-apex-gold transition-colors">{client.name}</div>
                      <div className="text-sm text-zinc-400 mt-0.5">
                        {cShifts.length} shift{cShifts.length > 1 ? 's' : ''} klaar voor facturatie
                        {client.vat && <> · BTW: {client.vat}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-apex-gold/20 text-apex-gold text-sm font-bold px-3 py-1 rounded-full">
                        {cShifts.length}
                      </span>
                      <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-apex-gold transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* STAP 2: shifts selecteren */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stap 2 van 2 — Selecteer shifts</div>
                  <div className="text-white font-bold mt-1">
                    {clients.find(c => c.id === selectedClientId)?.name}
                  </div>
                </div>
                <button
                  onClick={() => { setStep('client'); setSelectedClientId(''); }}
                  className="text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  ← Andere klant
                </button>
              </div>

              {/* Select all */}
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-3">
                <span className="text-sm text-zinc-400">
                  {selectedShiftIds.length} van {clientShifts.length} geselecteerd
                </span>
                <button
                  onClick={() => setSelectedShiftIds(
                    selectedShiftIds.length === clientShifts.length ? [] : clientShifts.map(s => s.id)
                  )}
                  className="text-apex-gold text-sm font-bold hover:text-white transition-colors"
                >
                  {selectedShiftIds.length === clientShifts.length ? 'Deselecteer alles' : 'Selecteer alles'}
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {clientShifts.map(shift => {
                  const checked = selectedShiftIds.includes(shift.id);
                  const start = new Date(shift.startTime);
                  const end = new Date(shift.endTime);
                  const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
                  return (
                    <div
                      key={shift.id}
                      onClick={() => toggleShift(shift.id)}
                      className={clsx(
                        'flex items-center gap-4 bg-zinc-900 border rounded-xl px-5 py-4 cursor-pointer transition-all',
                        checked ? 'border-apex-gold/50 bg-apex-gold/5' : 'border-zinc-800 hover:border-zinc-700'
                      )}
                    >
                      {checked
                        ? <CheckSquare className="w-5 h-5 text-apex-gold shrink-0" />
                        : <Square className="w-5 h-5 text-zinc-500 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">
                          {start.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {shift.location} · {start.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })} ({hours}u)
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 shrink-0 hidden sm:block">
                        {shift.serviceType || 'Bewaking'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateFromShifts}
                  disabled={selectedShiftIds.length === 0}
                  className="bg-apex-gold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-apex-gold/20 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Factuur aanmaken ({selectedShiftIds.length} shift{selectedShiftIds.length !== 1 ? 's' : ''})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HANDMATIG ── */}
      {mode === 'handmatig' && (
        <div className="space-y-6">
          {/* Klant + Periode */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Klant & Periode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="text-xs text-zinc-500 block mb-1.5 font-bold uppercase">Klant *</label>
                <select
                  value={manualClientId}
                  onChange={e => setManualClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none"
                >
                  <option value="">Selecteer klant...</option>
                  {clients.filter(c => c.status === 'Active').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5 font-bold uppercase">Periode van</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5 font-bold uppercase">Periode tot</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
              </div>
            </div>
          </div>

          {/* Factuurlijnen */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Factuurlijnen</h3>
              <button
                onClick={addLine}
                className="flex items-center gap-1.5 text-xs font-bold text-apex-gold hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Lijn toevoegen
              </button>
            </div>

            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
              <div className="col-span-4">Omschrijving</div>
              <div className="col-span-2 text-right">Aantal</div>
              <div className="col-span-2 text-right">Prijs (excl.)</div>
              <div className="col-span-1 text-right">BTW%</div>
              <div className="col-span-2 text-right">Totaal excl.</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                  <input
                    className="col-span-12 sm:col-span-4 bg-transparent border-0 text-white text-sm outline-none focus:bg-zinc-900 rounded px-1 py-1"
                    value={line.description}
                    onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Omschrijving..."
                  />
                  <input
                    className="col-span-4 sm:col-span-2 bg-zinc-900 border border-zinc-800 text-white text-sm text-right rounded px-2 py-1 outline-none focus:border-apex-gold"
                    type="number" min="0" step="0.5"
                    value={line.quantity}
                    onChange={e => updateLine(i, 'quantity', e.target.value)}
                  />
                  <input
                    className="col-span-4 sm:col-span-2 bg-zinc-900 border border-zinc-800 text-white text-sm text-right rounded px-2 py-1 outline-none focus:border-apex-gold"
                    type="number" min="0" step="0.01"
                    value={line.unitPrice}
                    onChange={e => updateLine(i, 'unitPrice', e.target.value)}
                  />
                  <input
                    className="col-span-3 sm:col-span-1 bg-zinc-900 border border-zinc-800 text-white text-sm text-right rounded px-2 py-1 outline-none focus:border-apex-gold"
                    type="number" min="0" max="100"
                    value={line.vatRate}
                    onChange={e => updateLine(i, 'vatRate', e.target.value)}
                  />
                  <div className="col-span-0 sm:col-span-2 hidden sm:flex justify-end text-zinc-300 text-sm font-mono">
                    € {fmt(line.totalExcl)}
                  </div>
                  <button
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    className="col-span-1 flex justify-center text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totalen */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <div className="space-y-1.5 w-56">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Subtotaal excl. BTW</span>
                  <span className="font-mono">€ {fmt(manualSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>BTW</span>
                  <span className="font-mono">€ {fmt(manualVat)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-700">
                  <span>Totaal incl. BTW</span>
                  <span className="font-mono text-apex-gold">€ {fmt(manualTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreateManual}
              disabled={!manualClientId || lines.length === 0 || manualTotal === 0}
              className="bg-apex-gold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-apex-gold/20 flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" /> Factuur aanmaken
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
