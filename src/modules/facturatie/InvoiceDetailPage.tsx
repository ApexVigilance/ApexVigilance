import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, InvoiceLine } from '../../data/store';
import {
  FileText, Download, Send, DollarSign, Calendar, User, Lock, History,
  ArrowLeft, Mail, Pencil, Save, X, Plus, Trash2, CheckCircle2
} from 'lucide-react';
import { renderInvoicePdf } from './pdfme/renderInvoicePdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { blobToBase64 } from '../../utils/blobToBase64';
import { sendInvoiceEmail } from '../../services/invoiceEmailApi';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const recalcLine = (l: Partial<InvoiceLine> & { quantity: number; unitPrice: number; vatRate: number }): InvoiceLine => {
  const totalExcl = Number((l.quantity * l.unitPrice).toFixed(2));
  const vatAmount = Number((totalExcl * l.vatRate / 100).toFixed(2));
  return { description: l.description || '', quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate, totalExcl, vatAmount, totalIncl: totalExcl + vatAmount };
};

export const InvoiceDetailPage: React.FC = () => {
  const { invoiceId } = useParams();
  const { t, i18n } = useTranslation();
  const { billingInvoices, billingUpdateInvoiceStatus, billingUpdateInvoice, clients, pricingConfig } = useStore();
  const navigate = useNavigate();

  const invoice = billingInvoices.find(i => i.id === invoiceId);
  const client  = clients.find(c => c.id === invoice?.clientId);
  const locale  = i18n.language?.startsWith('fr') ? 'fr-BE' : 'nl-BE';

  const [isSending, setIsSending]   = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [editLines, setEditLines]   = useState<InvoiceLine[]>([]);
  const [editNote, setEditNote]     = useState('');

  if (!invoice) return (
    <div className="p-8 text-center text-zinc-500">
      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>Factuur niet gevonden</p>
      <button onClick={() => navigate('/facturatie/facturen')} className="mt-4 text-apex-gold text-sm hover:underline">← Terug</button>
    </div>
  );

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Edit helpers ──
  const startEdit = () => { setEditLines(invoice.lines.map(l => ({ ...l }))); setEditNote(''); setEditMode(true); };
  const cancelEdit = () => setEditMode(false);

  const updateEditLine = (i: number, field: keyof InvoiceLine, value: string | number) => {
    setEditLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const upd = { ...l, [field]: field === 'description' ? value : parseFloat(value as string) || 0 };
      return recalcLine(upd);
    }));
  };

  const addEditLine = () =>
    setEditLines(prev => [...prev, recalcLine({ description: '', quantity: 1, unitPrice: 0, vatRate: pricingConfig.vatRate || 21 })]);

  const removeEditLine = (i: number) => setEditLines(prev => prev.filter((_, idx) => idx !== i));

  const saveEdit = () => {
    billingUpdateInvoice(invoice.id, editLines, editNote || 'Bewerkt door admin');
    setEditMode(false);
  };

  const editSubtotal = editLines.reduce((s, l) => s + l.totalExcl, 0);
  const editVat      = editLines.reduce((s, l) => s + l.vatAmount, 0);
  const editTotal    = editSubtotal + editVat;

  // ── PDF / email ──
  const handleDownload = async () => {
    try {
      const { blob, filename } = await renderInvoicePdf(invoice, client, t);
      downloadPdf(blob, filename);
    } catch (e) {
      alert('Fout bij het genereren van de PDF.');
    }
  };

  const handleSend = async () => {
    if (!client?.email) { alert('Geen e-mailadres gevonden voor deze klant.'); return; }
    if (!confirm(`Factuur verzenden naar ${client.email}?`)) return;
    setIsSending(true);
    try {
      const { blob, filename } = await renderInvoicePdf(invoice, client, t);
      const base64 = await blobToBase64(blob);
      await sendInvoiceEmail({
        to: [client.email],
        subject: `Factuur ${invoice.number} - Apex Vigilance Group`,
        html: `<p>Geachte ${client.name},</p><p>Hierbij ontvangt u factuur <strong>${invoice.number}</strong>.</p><p>Totaalbedrag: <strong>€ ${fmt(invoice.totalIncl)}</strong></p><p>Betalingsreferentie: ${invoice.ogm}</p><br><p>Met vriendelijke groeten,<br>Apex Vigilance Group</p>`,
        attachments: [{ filename, contentBase64: base64, contentType: 'application/pdf' }]
      });
      billingUpdateInvoiceStatus(invoice.id, 'Sent');
      alert('Factuur succesvol verzonden!');
    } catch (e: any) {
      alert(`Fout: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkPaid = () => {
    if (confirm('Factuur markeren als betaald?')) billingUpdateInvoiceStatus(invoice.id, 'Paid');
  };

  const statusStyle = clsx(
    'px-3 py-1 rounded text-xs font-bold uppercase border',
    invoice.status === 'Paid'    ? 'bg-green-900/20 text-green-400 border-green-900/50' :
    invoice.status === 'Sent'    ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
    'bg-zinc-800 text-zinc-400 border-zinc-700'
  );
  const statusLabel = invoice.status === 'Paid' ? 'Betaald' : invoice.status === 'Sent' ? 'Verzonden' : 'Concept';

  return (
    <div className="pb-20 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/facturatie/facturen')} className="flex items-center gap-2 text-apex-gold hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-wide">
        <ArrowLeft className="w-4 h-4" /> Alle facturen
      </button>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">{invoice.number}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={statusStyle}>{statusLabel}</span>
              {invoice.locked && (
                <span className="px-3 py-1 rounded text-xs font-bold uppercase border bg-zinc-800 text-zinc-500 border-zinc-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Vergrendeld
                </span>
              )}
              {invoice.status === 'Concept' && !invoice.locked && (
                <span className="text-xs text-zinc-500">Concept — kan nog worden bewerkt</span>
              )}
            </div>
          </div>
          <div className="text-left md:text-right shrink-0">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Totaal incl. BTW</div>
            <div className="text-apex-gold font-black text-3xl">€ {fmt(invoice.totalIncl)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={handleDownload}
            className="flex-1 sm:flex-none justify-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-colors">
            <Download className="w-4 h-4" /> Download PDF
          </button>

          {invoice.status === 'Concept' && !invoice.locked && !editMode && (
            <button onClick={startEdit}
              className="flex-1 sm:flex-none justify-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-colors">
              <Pencil className="w-4 h-4" /> Bewerken
            </button>
          )}

          {invoice.status !== 'Paid' && (
            <>
              <button onClick={handleSend} disabled={isSending}
                className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors">
                {isSending ? '...' : <><Send className="w-4 h-4" /> Verzenden per e-mail</>}
              </button>
              <button onClick={handleMarkPaid}
                className="flex-1 sm:flex-none justify-center bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Markeer als betaald
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Klant</h4>
          <div className="text-white font-bold">{invoice.clientName}</div>
          {invoice.clientAddress && <div className="text-zinc-400 text-sm mt-1">{invoice.clientAddress}</div>}
          {invoice.clientVat && <div className="text-zinc-500 text-xs mt-1">BTW: {invoice.clientVat}</div>}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Data</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Factuurdatum</span><span className="text-white">{new Date(invoice.date).toLocaleDateString(locale)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Vervaldatum</span>
              <span className={clsx('font-medium', invoice.status !== 'Paid' && new Date(invoice.dueDate) < new Date() ? 'text-red-400' : 'text-white')}>
                {new Date(invoice.dueDate).toLocaleDateString(locale)}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-zinc-400">Periode</span><span className="text-white text-xs">{new Date(invoice.periodStart).toLocaleDateString(locale)} – {new Date(invoice.periodEnd).toLocaleDateString(locale)}</span></div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Contact</h4>
          <div className="text-zinc-300 text-sm">{client?.email || '—'}</div>
          <div className="text-zinc-300 text-sm mt-1">{client?.phone || '—'}</div>
          {invoice.ogm && (
            <div className="mt-3 p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5">OGM / Mededeling</div>
              <div className="text-white font-mono text-sm font-bold tracking-widest">{invoice.ogm}</div>
            </div>
          )}
        </div>
      </div>

      {/* Lines — View OR Edit */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Factuurlijnen</h4>
          {editMode && (
            <div className="flex items-center gap-2">
              <button onClick={addEditLine} className="text-xs text-apex-gold font-bold flex items-center gap-1 hover:text-white transition-colors">
                <Plus className="w-3 h-3" /> Lijn toevoegen
              </button>
            </div>
          )}
        </div>

        {editMode ? (
          /* EDIT MODE */
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">
              <div className="col-span-4">Omschrijving</div>
              <div className="col-span-2 text-right">Aantal</div>
              <div className="col-span-2 text-right">Prijs excl.</div>
              <div className="col-span-1 text-right">BTW%</div>
              <div className="col-span-2 text-right">Totaal excl.</div>
              <div className="col-span-1"></div>
            </div>
            {editLines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                <input className="col-span-12 sm:col-span-4 bg-transparent border-0 text-white text-sm outline-none px-1 py-1 focus:bg-zinc-900 rounded"
                  value={line.description} placeholder="Omschrijving..."
                  onChange={e => updateEditLine(i, 'description', e.target.value)} />
                <input className="col-span-4 sm:col-span-2 bg-zinc-900 border border-zinc-800 text-white text-sm text-right rounded px-2 py-1 outline-none focus:border-apex-gold"
                  type="number" min="0" step="0.5" value={line.quantity}
                  onChange={e => updateEditLine(i, 'quantity', e.target.value)} />
                <input className="col-span-4 sm:col-span-2 bg-zinc-900 border border-zinc-800 text-white text-sm text-right rounded px-2 py-1 outline-none focus:border-apex-gold"
                  type="number" min="0" step="0.01" value={line.unitPrice}
                  onChange={e => updateEditLine(i, 'unitPrice', e.target.value)} />
                <input className="col-span-3 sm:col-span-1 bg-zinc-900 border border-zinc-800 text-white text-sm text-right rounded px-2 py-1 outline-none focus:border-apex-gold"
                  type="number" min="0" max="100" value={line.vatRate}
                  onChange={e => updateEditLine(i, 'vatRate', e.target.value)} />
                <div className="col-span-0 sm:col-span-2 hidden sm:flex justify-end text-zinc-300 text-sm font-mono">
                  € {fmt(line.totalExcl)}
                </div>
                <button onClick={() => removeEditLine(i)} disabled={editLines.length === 1}
                  className="col-span-1 flex justify-center text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Edit note */}
            <div className="mt-4">
              <label className="text-xs text-zinc-500 block mb-1">Reden van aanpassing (optioneel)</label>
              <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-apex-gold"
                value={editNote} placeholder="bv. Correctie uren, korting, ..."
                onChange={e => setEditNote(e.target.value)} />
            </div>

            {/* Edit totals */}
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-800">
              <div className="flex gap-3">
                <button onClick={saveEdit} className="bg-apex-gold hover:bg-yellow-500 text-black font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <Save className="w-4 h-4" /> Opslaan
                </button>
                <button onClick={cancelEdit} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-zinc-700 transition-colors">
                  <X className="w-4 h-4" /> Annuleren
                </button>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Nieuw totaal</div>
                <div className="text-apex-gold font-black text-xl">€ {fmt(editTotal)}</div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE */
          <>
            {/* Mobile */}
            <div className="block md:hidden space-y-3">
              {invoice.lines.map((line, idx) => (
                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="font-medium text-white mb-2">{line.description}</div>
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>{line.quantity.toFixed(2)} × € {line.unitPrice.toFixed(2)}</span>
                    <span>{line.vatRate}% BTW</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white mt-1">
                    <span>Excl. BTW</span>
                    <span>€ {fmt(line.totalExcl)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-950 text-zinc-500 font-bold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Omschrijving</th>
                    <th className="px-4 py-3 text-right">Aantal</th>
                    <th className="px-4 py-3 text-right">Eenheidsprijs</th>
                    <th className="px-4 py-3 text-right">BTW</th>
                    <th className="px-4 py-3 text-right">Totaal excl.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {invoice.lines.map((line, idx) => (
                    <tr key={idx} className="bg-zinc-900/50 hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 text-white">{line.description}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{line.quantity.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">€ {fmt(line.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{line.vatRate}%</td>
                      <td className="px-4 py-3 text-right text-white font-bold">€ {fmt(line.totalExcl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Totals (view mode) */}
        {!editMode && (
          <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotaal excl. BTW</span>
                <span className="font-mono">€ {fmt(invoice.subtotalExcl)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>BTW</span>
                <span className="font-mono">€ {fmt(invoice.vatTotal)}</span>
              </div>
              <div className="flex justify-between text-white font-black text-lg pt-2 border-t border-zinc-700">
                <span>Totaal incl. BTW</span>
                <span className="font-mono text-apex-gold">€ {fmt(invoice.totalIncl)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit log */}
      {invoice.auditLog && invoice.auditLog.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><History className="w-3.5 h-3.5" /> Activiteitenlog</h4>
          <div className="space-y-2">
            {[...invoice.auditLog].reverse().map((log, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center text-xs text-zinc-400 gap-1 sm:gap-4 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                <span className="font-mono text-zinc-500 shrink-0">{new Date(log.date).toLocaleString(locale)}</span>
                <span className="font-bold text-zinc-300">{log.user}</span>
                <span className="text-white">{log.action}</span>
                {log.reason && <span className="italic text-zinc-500 sm:ml-auto">— {log.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
