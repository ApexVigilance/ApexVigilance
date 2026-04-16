import { Invoice, Shift, Client, PricingConfig, InvoiceLine } from '../data/types';
import { getNextInvoiceNumber } from './invoiceNumberService';
import { generateOgm } from './ogmGenerator';
import { calculateShiftCost } from './pricingEngine';
import { isShiftEligibleForInvoice } from './shiftEligibilityService';

export const createInvoice = (
  client: Client,
  shifts: Shift[],
  config: PricingConfig,
  year: number,
  lastSequence: number,
  periodStart: string,
  periodEnd: string
): { invoice: Invoice, updatedShifts: Shift[], nextSequence: number } | null => {

  // 1. Filter Eligible Shifts
  const eligibleShifts = shifts.filter(s => {
    if (!isShiftEligibleForInvoice(s)) return false;
    
    // Check if shift is within period
    // Use startTime for comparison
    const shiftDate = new Date(s.startTime).toISOString().split('T')[0];
    return shiftDate >= periodStart && shiftDate <= periodEnd;
  });

  if (eligibleShifts.length === 0) return null;

  // 2. Calculate Lines
  let lines: InvoiceLine[] = [];
  eligibleShifts.forEach(shift => {
    const shiftLines = calculateShiftCost(shift, config);
    // Add shift date/ref to description for clarity
    const dateStr = new Date(shift.startTime).toLocaleDateString('nl-BE');
    const enrichedLines = shiftLines.map(l => ({
      ...l,
      description: `${dateStr} - ${l.description}`
    }));
    lines = [...lines, ...enrichedLines];
  });

  // 3. Aggregate Totals
  const subtotalExcl = lines.reduce((sum, l) => sum + l.totalExcl, 0);
  const vatTotal = lines.reduce((sum, l) => sum + l.vatAmount, 0);
  const totalIncl = subtotalExcl + vatTotal;

  // 4. Generate Numbers
  const { number, sequence } = getNextInvoiceNumber(year, lastSequence);
  const ogm = generateOgm(number);
  const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 5. Create Invoice Object
  const invoice: Invoice = {
    id: invoiceId,
    number,
    ogm,
    clientId: client.id,
    clientName: client.name,
    clientAddress: client.address,
    clientVat: client.vat,
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    periodStart,
    periodEnd,
    lines,
    subtotalExcl: Number(subtotalExcl.toFixed(2)),
    vatTotal: Number(vatTotal.toFixed(2)),
    totalIncl: Number(totalIncl.toFixed(2)),
    status: 'Concept',
    locked: false,
    createdAt: new Date().toISOString(),
    auditLog: [{
      date: new Date().toISOString(),
      action: 'Created',
      user: 'System',
      reason: `Generated from ${eligibleShifts.length} shifts`
    }]
  };

  // 6. Link Shifts
  const updatedShifts = eligibleShifts.map(s => ({
    ...s,
    invoiceId: invoiceId,
    invoicedAt: new Date().toISOString()
  }));

  return { invoice, updatedShifts, nextSequence: sequence };
};
