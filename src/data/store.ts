
import { create } from 'zustand';
import {
  Employee, Shift, Incident, Client, Report, PricingConfig, Invoice, InvoiceLine, TimeLog,
  InvoiceOverride, FullReport, FullIncident, FullClient, ClientLocation, IncidentComment, SystemUpdate,
  AuditEntry, ReviewStatus, ShiftApplication, TimeEvent, OnboardingStatus, SmtpConfig, ApplicationStatus, InvoiceStatus,
  ShiftRequest, PendingRegistration
} from './types';
import { SEED_EMPLOYEES, SEED_SHIFTS, SEED_INCIDENTS, SEED_CLIENTS, SEED_REPORTS, SEED_TIME_LOGS } from './seed';
import { createInvoice } from '../services/invoiceFactory';
import { generateOgm } from '../services/ogmGenerator';

export * from './types';

const KEYS = {
  PRICING: 'apex_billing_config_v2',
  LOGO: 'apex_brand_logo_v2',
  TEMPLATE: 'apex_invoice_template_v2',
  OVERRIDES: 'apex_billing_overrides_v2',
  INVOICES: 'apex_billing_invoices_v2',
  APPLICATIONS: 'apex_applications_v2',
  SHIFTS: 'apex_shifts_v2',
  TIMELOGS: 'apex_timelogs_v2',
  THEME: 'apex_theme_v2',
  REGISTRATIONS: 'apex_pending_registrations'
};

const loadFromStorage = <T>(key: string, seed: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored);
    // Persist seed data so auth and other modules can read it directly from localStorage
    if (Array.isArray(seed) ? (seed as unknown[]).length > 0 : seed !== null && seed !== undefined) {
      localStorage.setItem(key, JSON.stringify(seed));
    }
    return seed;
  } catch (e) {
    return seed;
  }
};

const defaultPricing: PricingConfig = {
  matrix: {
    'Statisch': { 'Week': 39, 'Zaterdag': 45, 'Zondag': 49, 'Feestdag': 55 },
    'Winkel': { 'Week': 42, 'Zaterdag': 48, 'Zondag': 52, 'Feestdag': 58 },
    'Werf': { 'Week': 41, 'Zaterdag': 47, 'Zondag': 51, 'Feestdag': 57 },
    'Event': { 'Week': 45, 'Zaterdag': 52, 'Zondag': 58, 'Feestdag': 65 },
    'Haven': { 'Week': 48, 'Zaterdag': 56, 'Zondag': 62, 'Feestdag': 70 },
    'Overig': { 'Week': 40, 'Zaterdag': 48, 'Zondag': 60, 'Feestdag': 80 }
  },
  nightFactor: 1.15,
  vatRate: 21,
  minHours: 4,
  lastMinuteFactor: 1.5,
  smtp: { host: 'send.one.com', port: 465, user: 'info@apexsecurity.be', pass: '' },
  invoiceSequence: {},
  clientSequence: {}
};

export const getGroupKey = (c:string, l:string, s:string, e:string) => btoa(JSON.stringify({c, l, s, e}));

export const generateGroupId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `GRP-${crypto.randomUUID().toUpperCase()}`;
  }
  return `GRP-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

interface AppState {
  employees: Employee[];
  shifts: Shift[];
  applications: ShiftApplication[]; 
  incidents: FullIncident[];
  clients: FullClient[]; 
  locations: ClientLocation[];
  reports: FullReport[];
  timeLogs: TimeLog[];
  updates: SystemUpdate[];
  language: 'nl' | 'fr';
  theme: 'light' | 'dark';
  billingInvoices: Invoice[];
  billingOverrides: InvoiceOverride[];
  pricingConfig: PricingConfig;
  brandLogoBase64: string | null;
  invoiceTemplateBase64: string | null;
  shiftRequests: ShiftRequest[];
  createShiftRequest: (req: Omit<ShiftRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateShiftRequest: (id: string, updates: Partial<ShiftRequest>) => void;
  hydrateConfig: () => void;
  setLanguage: (lang: 'nl' | 'fr') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  billingReset: () => void;
  billingSetOverride: (shiftId: string, billableHours: number, reason: string) => void;
  billingMarkInvoiced: (shiftId: string, isInvoiced: boolean) => void;
  billingAddInvoice: (invoice: Invoice) => void;
  billingUpdateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  billingGetNextInvoiceNumber: () => string;
  generateDraftInvoices: (periodStart: string, periodEnd: string) => void;
  getNextClientRef: () => string;
  savePricingConfig: (config: Partial<PricingConfig>) => void;
  saveSmtpConfig: (config: SmtpConfig) => void;
  saveBrevoConfig: (apiKey: string, senderEmail: string) => void;
  saveBrandLogo: (base64: string | null) => void;
  saveInvoiceTemplate: (base64: string | null) => void;
  addTimeLog: (log: TimeLog) => void;
  updateTimeLog: (id: string, updates: Partial<TimeLog>) => void;
  createTimeLog: (log: TimeLog) => void;
  logTimeEvent: (logId: string, event: TimeEvent) => void;
  reviewTimeEvent: (eventId: string, status: ReviewStatus, reviewerId: string, note?: string) => void;
  createReport: (report: FullReport) => void;
  updateReport: (id: string, updates: Partial<FullReport>) => void;
  deleteReport: (id: string) => void;
  submitReport: (id: string) => void;
  approveReport: (id: string) => void;
  rejectReport: (id: string, reason: string) => void;
  retryReportEmail: (id: string) => void;
  createIncident: (incident: FullIncident) => void;
  updateIncident: (id: string, updates: Partial<FullIncident>) => void;
  submitIncident: (id: string) => void;
  approveIncident: (id: string) => void;
  rejectIncident: (id: string, reason: string) => void;
  retryIncidentEmail: (id: string) => void;
  addIncidentComment: (id: string, text: string, author: string) => void;
  createClient: (client: FullClient) => void;
  updateClient: (id: string, updates: Partial<FullClient>) => void;
  toggleClientActive: (id: string) => void;
  createLocation: (location: ClientLocation) => void;
  updateLocation: (id: string, updates: Partial<ClientLocation>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  updateBadge: (id: string, data: { badgeNr?: string, badgeExpiry: string, badgePhotoUrl?: string }, actor: string) => void;
  reviewSection: (adminId: string, employeeId: string, section: 'personal' | 'id' | 'badge', status: OnboardingStatus, reason?: string) => void;
  runDailyBadgeCheck: () => void;
  applyForShift: (criteria: {c:string, l:string, s:string, e:string}, agentId: string) => void;
  withdrawApplication: (applicationId: string) => void;
  approveApplication: (applicationId: string, adminId: string) => { success: boolean; error?: string };
  rejectApplication: (applicationId: string, adminId: string, reason?: string) => void;
  claimShift: (criteria: {c:string, l:string, s:string, e:string}, agentId: string) => boolean;
  unclaimShift: (criteria: {c:string, l:string, s:string, e:string}, agentId: string) => void;
  addUpdate: (text: string, type: SystemUpdate['type']) => void;
  createShifts: (shifts: Shift[]) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  updateShiftGroup: (ids: string[], updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  deleteGroup: (groupId: string) => void;
  approveShift: (shiftId: string, adminId: string) => void;
  rejectShift: (shiftId: string, adminId: string, reason: string) => void;
  billingUpdateInvoice: (id: string, lines: InvoiceLine[], note?: string) => void;
  createInvoiceForClient: (clientId: string, shiftIds: string[]) => void;
  createManualInvoice: (clientId: string, periodStart: string, periodEnd: string, lines: InvoiceLine[]) => void;
  pendingRegistrations: PendingRegistration[];
  addPendingRegistration: (data: Omit<PendingRegistration, 'id' | 'status' | 'submittedAt'>) => void;
  reviewPendingRegistration: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) => void;
  addEmployee: (data: Omit<Employee, 'id' | 'auditLog' | 'personalInfoStatus' | 'idCardStatus' | 'badgeDataStatus'>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  employees: loadFromStorage('apex_employees', SEED_EMPLOYEES),
  shifts: loadFromStorage(KEYS.SHIFTS, SEED_SHIFTS),
  applications: loadFromStorage(KEYS.APPLICATIONS, []), 
  incidents: loadFromStorage('apex_incidents', SEED_INCIDENTS as FullIncident[]),
  clients: loadFromStorage('apex_clients', SEED_CLIENTS), 
  locations: loadFromStorage('apex_locations', []),
  reports: loadFromStorage('apex_reports', SEED_REPORTS as FullReport[]),
  timeLogs: loadFromStorage(KEYS.TIMELOGS, SEED_TIME_LOGS),
  updates: loadFromStorage('apex_system_updates', []),
  language: 'nl',
  theme: (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'dark',
  billingInvoices: loadFromStorage(KEYS.INVOICES, []),
  billingOverrides: loadFromStorage(KEYS.OVERRIDES, []),
  pricingConfig: loadFromStorage(KEYS.PRICING, defaultPricing),
  shiftRequests: loadFromStorage('apex_shift_requests', []),
  pendingRegistrations: loadFromStorage(KEYS.REGISTRATIONS, []),
  brandLogoBase64: localStorage.getItem(KEYS.LOGO),
  invoiceTemplateBase64: localStorage.getItem(KEYS.TEMPLATE),
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (theme) => {
    localStorage.setItem(KEYS.THEME, theme);
    set({ theme });
  },
  hydrateConfig: () => {
      let rawShifts = loadFromStorage(KEYS.SHIFTS, SEED_SHIFTS);
      let needsSave = false;
      const criteriaMap = new Map<string, string>();
      const shiftsWithGroups = rawShifts.map(s => {
          if (s.groupId && s.groupId.startsWith('GRP-') && s.groupId.length > 20) return s;
          needsSave = true;
          const criteriaKey = JSON.stringify({ c: s.clientName, l: s.location, s: s.startTime, e: s.endTime });
          if (!criteriaMap.has(criteriaKey)) criteriaMap.set(criteriaKey, generateGroupId());
          return { ...s, groupId: criteriaMap.get(criteriaKey)! };
      });
      if (needsSave) localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shiftsWithGroups));

      set({
          billingInvoices: loadFromStorage(KEYS.INVOICES, []),
          billingOverrides: loadFromStorage(KEYS.OVERRIDES, []),
          pricingConfig: loadFromStorage(KEYS.PRICING, defaultPricing),
          brandLogoBase64: localStorage.getItem(KEYS.LOGO),
          invoiceTemplateBase64: localStorage.getItem(KEYS.TEMPLATE),
          applications: loadFromStorage(KEYS.APPLICATIONS, []),
          shifts: shiftsWithGroups,
          timeLogs: loadFromStorage(KEYS.TIMELOGS, SEED_TIME_LOGS)
      });
  },
  billingReset: () => set(state => {
      localStorage.removeItem(KEYS.INVOICES);
      localStorage.removeItem(KEYS.OVERRIDES);
      const resetPricing = { ...state.pricingConfig, invoiceSequence: {}, clientSequence: {} };
      localStorage.setItem(KEYS.PRICING, JSON.stringify(resetPricing));
      return { billingInvoices: [], billingOverrides: [], pricingConfig: resetPricing };
  }),
  billingSetOverride: (shiftId, billableHours, reason) => set(s => {
      const existing = s.billingOverrides.find(o => o.shiftId === shiftId);
      const newOverrides = existing 
        ? s.billingOverrides.map(o => o.shiftId === shiftId ? { ...o, billableHours, correctionReason: reason } : o)
        : [...s.billingOverrides, { shiftId, billableHours, correctionReason: reason, isInvoiced: false }];
      localStorage.setItem(KEYS.OVERRIDES, JSON.stringify(newOverrides));
      return { billingOverrides: newOverrides };
  }),
  billingMarkInvoiced: (shiftId, isInvoiced) => set(s => {
      const existing = s.billingOverrides.find(o => o.shiftId === shiftId);
      let newOverrides = existing 
          ? s.billingOverrides.map(o => o.shiftId === shiftId ? { ...o, isInvoiced } : o)
          : [...s.billingOverrides, { shiftId, billableHours: 0, isInvoiced, correctionReason: 'System Auto-Invoice' }];
      localStorage.setItem(KEYS.OVERRIDES, JSON.stringify(newOverrides));
      return { billingOverrides: newOverrides };
  }),
  billingAddInvoice: (invoice) => set(s => {
      const newInvoices = [invoice, ...s.billingInvoices];
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(newInvoices));
      return { billingInvoices: newInvoices };
  }),
  billingUpdateInvoiceStatus: (id, status) => set(s => {
      const newInvoices = s.billingInvoices.map(i => i.id === id ? { ...i, status, sentAt: status === 'Sent' ? new Date().toISOString() : i.sentAt, paidAt: status === 'Paid' ? new Date().toISOString() : i.paidAt } : i);
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(newInvoices));
      return { billingInvoices: newInvoices };
  }),
  billingGetNextInvoiceNumber: () => {
      const state = get();
      const year = new Date().getFullYear();
      const seqMap = state.pricingConfig.invoiceSequence || {};
      const nextCount = (seqMap[year] || 0) + 1;
      const newConfig = { ...state.pricingConfig, invoiceSequence: { ...seqMap, [year]: nextCount } };
      set({ pricingConfig: newConfig });
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return `F${year}-${String(nextCount).padStart(4, '0')}`;
  },

  generateDraftInvoices: (periodStart, periodEnd) => {
      const state = get();
      const year = new Date().getFullYear();
      
      let currentSequence = state.pricingConfig.invoiceSequence?.[year] || 0;
      
      const newInvoices: Invoice[] = [];
      let updatedShifts = [...state.shifts];
      
      // Iterate active clients
      state.clients.filter(c => c.status === 'Active').forEach(client => {
          // Filter shifts for this client that fall within period (rough filter, factory does precise check)
          // We pass all shifts for the client to the factory, it handles eligibility
          const clientShifts = updatedShifts.filter(s => 
             (s.clientId === client.id || s.clientName === client.name)
          );
          
          const result = createInvoice(
              client, 
              clientShifts, 
              state.pricingConfig, 
              year, 
              currentSequence, 
              periodStart, 
              periodEnd
          );
          
          if (result) {
              newInvoices.push(result.invoice);
              currentSequence = result.nextSequence;
              
              // Update shifts with new invoice linkage
              result.updatedShifts.forEach(us => {
                  const idx = updatedShifts.findIndex(s => s.id === us.id);
                  if (idx !== -1) updatedShifts[idx] = us;
              });
          }
      });

      if (newInvoices.length > 0) {
          const finalInvoices = [...newInvoices, ...state.billingInvoices];
          
          const newConfig = {
              ...state.pricingConfig,
              invoiceSequence: {
                  ...state.pricingConfig.invoiceSequence,
                  [year]: currentSequence
              }
          };

          set({ 
              billingInvoices: finalInvoices,
              shifts: updatedShifts,
              pricingConfig: newConfig
          });
          
          localStorage.setItem(KEYS.INVOICES, JSON.stringify(finalInvoices));
          localStorage.setItem(KEYS.SHIFTS, JSON.stringify(updatedShifts));
          localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      }
  },
  billingUpdateInvoice: (id, lines, note) => set(s => {
      const invoice = s.billingInvoices.find(i => i.id === id);
      if (!invoice || invoice.locked) return {};
      const subtotalExcl = lines.reduce((sum, l) => sum + l.totalExcl, 0);
      const vatTotal = lines.reduce((sum, l) => sum + l.vatAmount, 0);
      const totalIncl = subtotalExcl + vatTotal;
      const auditEntry = { date: new Date().toISOString(), action: note || 'Bewerkt door admin', user: 'Admin' };
      const newInvoices = s.billingInvoices.map(i => i.id === id ? {
          ...i, lines,
          subtotalExcl: Number(subtotalExcl.toFixed(2)),
          vatTotal: Number(vatTotal.toFixed(2)),
          totalIncl: Number(totalIncl.toFixed(2)),
          auditLog: [...(i.auditLog || []), auditEntry]
      } : i);
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(newInvoices));
      return { billingInvoices: newInvoices };
  }),
  createInvoiceForClient: (clientId, shiftIds) => {
      const state = get();
      const client = state.clients.find(c => c.id === clientId);
      if (!client) return;
      const selectedShifts = state.shifts.filter(s => shiftIds.includes(s.id));
      if (selectedShifts.length === 0) return;
      const year = new Date().getFullYear();
      const currentSeq = state.pricingConfig.invoiceSequence?.[year] || 0;
      const dates = selectedShifts.map(s => new Date(s.startTime));
      const periodStart = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
      const periodEnd = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
      const result = createInvoice(client, selectedShifts, state.pricingConfig, year, currentSeq, periodStart, periodEnd);
      if (!result) return;
      const finalInvoices = [result.invoice, ...state.billingInvoices];
      let updatedShifts = [...state.shifts];
      result.updatedShifts.forEach(us => {
          const idx = updatedShifts.findIndex(s => s.id === us.id);
          if (idx !== -1) updatedShifts[idx] = us;
      });
      const newConfig = { ...state.pricingConfig, invoiceSequence: { ...state.pricingConfig.invoiceSequence, [year]: result.nextSequence } };
      set({ billingInvoices: finalInvoices, shifts: updatedShifts, pricingConfig: newConfig });
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(finalInvoices));
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(updatedShifts));
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return result.invoice;
  },
  createManualInvoice: (clientId, periodStart, periodEnd, lines) => {
      const state = get();
      const client = state.clients.find(c => c.id === clientId);
      if (!client) return;
      const subtotalExcl = lines.reduce((sum, l) => sum + l.totalExcl, 0);
      const vatTotal = lines.reduce((sum, l) => sum + l.vatAmount, 0);
      const totalIncl = subtotalExcl + vatTotal;
      const year = new Date().getFullYear();
      const currentSeq = state.pricingConfig.invoiceSequence?.[year] || 0;
      const nextSeq = currentSeq + 1;
      const number = `F${year}-${String(nextSeq).padStart(4, '0')}`;
      const ogm = generateOgm(number);
      const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const invoice: Invoice = {
          id: invoiceId, number, ogm,
          clientId: client.id, clientName: client.name,
          clientAddress: client.address, clientVat: client.vat,
          date: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          periodStart, periodEnd, lines,
          subtotalExcl: Number(subtotalExcl.toFixed(2)),
          vatTotal: Number(vatTotal.toFixed(2)),
          totalIncl: Number(totalIncl.toFixed(2)),
          status: 'Concept', locked: false,
          createdAt: new Date().toISOString(),
          auditLog: [{ date: new Date().toISOString(), action: 'Handmatig aangemaakt door admin', user: 'Admin' }]
      };
      const newConfig = { ...state.pricingConfig, invoiceSequence: { ...state.pricingConfig.invoiceSequence, [year]: nextSeq } };
      const finalInvoices = [invoice, ...state.billingInvoices];
      set({ billingInvoices: finalInvoices, pricingConfig: newConfig });
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(finalInvoices));
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return invoice;
  },
  getNextClientRef: () => {
      const state = get();
      const year = new Date().getFullYear();
      const seqMap = state.pricingConfig.clientSequence || {};
      const nextCount = (seqMap[year] || 0) + 1;
      const newConfig = { ...state.pricingConfig, clientSequence: { ...seqMap, [year]: nextCount } };
      set({ pricingConfig: newConfig });
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return `CLI-${year}-${String(nextCount).padStart(4, '0')}`;
  },
  createShiftRequest: (req) => set(s => {
      const newReq: ShiftRequest = {
          ...req, id: `REQ-${Date.now()}`,
          status: 'Pending', createdAt: new Date().toISOString(),
      };
      const updated = [newReq, ...s.shiftRequests];
      localStorage.setItem('apex_shift_requests', JSON.stringify(updated));
      return { shiftRequests: updated };
  }),
  updateShiftRequest: (id, updates) => set(s => {
      const updated = s.shiftRequests.map(r => r.id === id ? { ...r, ...updates } : r);
      localStorage.setItem('apex_shift_requests', JSON.stringify(updated));
      return { shiftRequests: updated };
  }),
  savePricingConfig: (config) => set(s => {
      const newConfig = { ...s.pricingConfig, ...config };
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return { pricingConfig: newConfig };
  }),
  saveSmtpConfig: (config) => set(s => {
      const newConfig = { ...s.pricingConfig, smtp: config };
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return { pricingConfig: newConfig };
  }),
  saveBrevoConfig: (apiKey, senderEmail) => set(s => {
      const newConfig = { ...s.pricingConfig, brevoApiKey: apiKey, brevoSenderEmail: senderEmail };
      localStorage.setItem(KEYS.PRICING, JSON.stringify(newConfig));
      return { pricingConfig: newConfig };
  }),
  saveBrandLogo: (base64) => {
      if (base64) {
          localStorage.setItem(KEYS.LOGO, base64);
          localStorage.setItem('apex_logo_data_url', base64); // used by PDF generator
      } else {
          localStorage.removeItem(KEYS.LOGO);
          localStorage.removeItem('apex_logo_data_url');
      }
      set({ brandLogoBase64: base64 });
  },
  saveInvoiceTemplate: (base64) => {
      if (base64) localStorage.setItem(KEYS.TEMPLATE, base64);
      else localStorage.removeItem(KEYS.TEMPLATE);
      set({ invoiceTemplateBase64: base64 });
  },
  addTimeLog: (log) => set(s => { 
      const n = [...s.timeLogs, log]; 
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(n)); 
      return { timeLogs: n }; 
  }),
  updateTimeLog: (id, u) => set(s => { 
      const n = s.timeLogs.map(t => t.id === id ? { ...t, ...u } : t); 
      let newShifts = s.shifts;
      
      // If approving time log, approve the shift too
      if (u.approvalStatus === 'APPROVED') {
          const log = s.timeLogs.find(t => t.id === id);
          if (log) {
              newShifts = s.shifts.map(sh => sh.id === log.shiftId ? { 
                  ...sh, 
                  status: 'Approved',
                  auditLog: [...(sh.auditLog || []), { date: new Date().toISOString(), action: 'Auto-Approved via TimeLog', user: 'System' }]
              } : sh);
          }
      }

      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(n)); 
      if (newShifts !== s.shifts) localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { timeLogs: n, shifts: newShifts }; 
  }),
  createTimeLog: (log) => set(s => { 
      const nLogs = [...s.timeLogs, log]; 
      const nShifts = s.shifts.map(sh => (sh.id === log.shiftId && sh.status !== 'Cancelled' && sh.status !== 'Completed') ? { ...sh, status: 'Active' as const } : sh);
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(nLogs)); 
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(nShifts));
      return { timeLogs: nLogs, shifts: nShifts }; 
  }),
  logTimeEvent: (id, ev) => set(s => { 
      const nLogs = s.timeLogs.map(l => {
          if (l.id !== id) return l;
          const updatedLog = { ...l, events: [...l.events, ev] };
          if (ev.type === 'INKLOK') updatedLog.currentStatus = 'IN_DIENST';
          else if (ev.type === 'UITKLOK') { updatedLog.currentStatus = 'AFGEROND'; updatedLog.clockOut = ev.timestamp; }
          else if (ev.type === 'PAUZE_START') updatedLog.currentStatus = 'PAUZE';
          else if (ev.type === 'PAUZE_STOP') updatedLog.currentStatus = 'IN_DIENST';
          return updatedLog;
      });
      let nShifts = s.shifts;
      if (ev.type === 'UITKLOK') {
          const targetLog = s.timeLogs.find(t => t.id === id);
          if (targetLog) {
              nShifts = s.shifts.map(sh => (sh.id === targetLog.shiftId && sh.status !== 'Cancelled') ? { ...sh, status: 'Completed' as const } : sh);
          }
      }
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(nLogs)); 
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(nShifts));
      return { timeLogs: nLogs, shifts: nShifts }; 
  }),
  reviewTimeEvent: (eid, stat, reviewer, note) => set(s => { 
      const n = s.timeLogs.map(l => ({ ...l, events: l.events.map(e => e.id === eid ? { ...e, reviewStatus: stat, reviewNote: note, reviewedBy: reviewer, reviewedAt: new Date().toISOString() } : e) })); 
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(n)); 
      return { timeLogs: n }; 
  }),
  createReport: (report) => set(s => { 
      const n = [...s.reports, report]; 
      localStorage.setItem('apex_reports', JSON.stringify(n)); 
      return { reports: n }; 
  }),
  updateReport: (id, u) => set(s => { 
      const n = s.reports.map(r => r.id === id ? { ...r, ...u } : r); 
      localStorage.setItem('apex_reports', JSON.stringify(n)); 
      return { reports: n }; 
  }),
  deleteReport: (id) => set(s => { 
      const n = s.reports.filter(r => r.id !== id); 
      localStorage.setItem('apex_reports', JSON.stringify(n)); 
      return { reports: n }; 
  }),
  submitReport: (id) => get().updateReport(id, { status: 'Submitted', auditLog: [...(get().reports.find(r=>r.id===id)?.auditLog||[]), { action: 'Submitted', user: 'Agent', date: new Date().toISOString() }] }),
  approveReport: (id) => get().updateReport(id, { status: 'Approved', auditLog: [...(get().reports.find(r=>r.id===id)?.auditLog||[]), { action: 'Approved', user: 'Admin', date: new Date().toISOString() }] }),
  rejectReport: (id, reason) => get().updateReport(id, { status: 'Rejected', lastRejectedReason: reason, auditLog: [...(get().reports.find(r=>r.id===id)?.auditLog||[]), { action: 'Rejected', user: 'Admin', date: new Date().toISOString(), reason }] }),
  retryReportEmail: (id) => {
    get().updateReport(id, {
      emailStatus: 'PENDING',
      auditLog: [...(get().reports.find(r => r.id === id)?.auditLog || []),
        { action: 'Email herstart door admin', user: 'Admin', date: new Date().toISOString() }]
    });
  },
  createIncident: (inc) => set(s => { 
      const n = [...s.incidents, inc]; 
      localStorage.setItem('apex_incidents', JSON.stringify(n)); 
      return { incidents: n }; 
  }),
  updateIncident: (id, u) => set(s => { 
      const n = s.incidents.map(i => i.id === id ? { ...i, ...u } : i); 
      localStorage.setItem('apex_incidents', JSON.stringify(n)); 
      return { incidents: n }; 
  }),
  submitIncident: (id) => get().updateIncident(id, { status: 'Submitted' }),
  approveIncident: (id) => get().updateIncident(id, { status: 'Approved', approvedBy: 'Admin', approvedAt: new Date().toISOString() }),
  rejectIncident: (id, reason) => get().updateIncident(id, { status: 'Rejected', rejectedReason: reason }),
  retryIncidentEmail: (id) => {
      get().updateIncident(id, { 
          emailStatus: 'PENDING', 
          auditLog: [...(get().incidents.find(i=>i.id===id)?.auditLog||[]), { action: 'Email Retry Initiated', user: 'Admin', date: new Date().toISOString() }]
      });
  },
  addIncidentComment: (id, text, author) => {
      get().updateIncident(id, { 
          comments: [...(get().incidents.find(i=>i.id===id)?.comments||[]), { 
              id: Date.now().toString(), 
              text, 
              author: author || 'Unknown', 
              date: new Date().toISOString() 
          }] 
      });
  },
  createClient: (client) => {
      const state = get();
      const finalClient = { ...client, clientRef: client.clientRef || state.getNextClientRef() };
      set(s => {
          const n = [...s.clients, finalClient];
          localStorage.setItem('apex_clients', JSON.stringify(n));
          return { clients: n };
      });
  },
  updateClient: (id, updates) => set(s => {
      const n = s.clients.map(c => c.id === id ? { ...c, ...updates } : c);
      localStorage.setItem('apex_clients', JSON.stringify(n));
      return { clients: n };
  }),
  addEmployee: (data) => set(s => {
      const newEmployee: Employee = {
          ...data,
          id: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          personalInfoStatus: 'MISSING',
          idCardStatus: 'MISSING',
          badgeDataStatus: 'MISSING',
          auditLog: [{ date: new Date().toISOString(), action: 'Profiel aangemaakt door admin', user: 'Admin' }],
      };
      const n = [...s.employees, newEmployee];
      localStorage.setItem('apex_employees', JSON.stringify(n));
      return { employees: n };
  }),
  addPendingRegistration: (data) => set(s => {
      const reg: PendingRegistration = {
          ...data,
          id: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
      };
      const n = [...s.pendingRegistrations, reg];
      localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(n));
      return { pendingRegistrations: n };
  }),
  reviewPendingRegistration: (id, action, reason) => {
      const state = get();
      const reg = state.pendingRegistrations.find(r => r.id === id);
      if (!reg) return;

      const now = new Date().toISOString();

      if (action === 'APPROVE') {
          if (reg.type === 'agent') {
              const validRoles = ['Guard', 'Senior', 'Supervisor', 'PlanningMaster', 'Coordinator', 'Admin'];
              const empRole = (validRoles.includes(reg.employeeRole || '') ? reg.employeeRole : 'Guard') as Employee['role'];
              const newEmployee: Employee = {
                  id: `EMP-${Date.now()}`,
                  name: `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || 'Nieuwe Agent',
                  firstName: reg.firstName,
                  lastName: reg.lastName,
                  role: empRole,
                  status: 'Active',
                  email: reg.email,
                  phone: reg.phone,
                  address: reg.address,
                  languages: reg.languages,
                  personalInfoStatus: 'MISSING',
                  idCardStatus: 'MISSING',
                  badgeDataStatus: 'MISSING',
                  auditLog: [{ date: now, action: 'Account aangemaakt via registratie', user: 'Admin' }],
              };
              set(s => {
                  const emps = [...s.employees, newEmployee];
                  localStorage.setItem('apex_employees', JSON.stringify(emps));
                  return { employees: emps };
              });
          } else {
              const clientRef = state.getNextClientRef();
              const newClient: FullClient = {
                  id: `CLI-${Date.now()}`,
                  clientRef,
                  name: reg.companyName || 'Nieuw Bedrijf',
                  contact: reg.contactPerson || '',
                  status: 'Active',
                  locations: 0,
                  email: reg.email,
                  phone: reg.phone,
                  address: reg.address,
                  vat: reg.vat,
              } as FullClient;
              set(s => {
                  const cls = [...s.clients, newClient];
                  localStorage.setItem('apex_clients', JSON.stringify(cls));
                  return { clients: cls };
              });
          }
      }

      set(s => {
          const n = s.pendingRegistrations.map(r =>
              r.id === id
                  ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' as PendingRegistration['status'], reviewedAt: now, reviewedBy: 'Admin', rejectionReason: reason }
                  : r
          );
          localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(n));
          return { pendingRegistrations: n };
      });
  },
  toggleClientActive: (id) => set(s => {
      const n = s.clients.map(c => c.id === id ? { ...c, status: (c.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive' } : c);
      localStorage.setItem('apex_clients', JSON.stringify(n));
      return { clients: n };
  }),
  createLocation: (loc) => set(s => { 
      const n = [...s.locations, loc]; 
      localStorage.setItem('apex_locations', JSON.stringify(n)); 
      return { locations: n }; 
  }),
  updateLocation: (id, updates) => set(s => {
      const n = s.locations.map(l => l.id === id ? { ...l, ...updates } : l);
      localStorage.setItem('apex_locations', JSON.stringify(n));
      return { locations: n };
  }),
  addUpdate: (text, type) => set(s => {
      const u: SystemUpdate = { id: `UP-${Date.now()}`, text, type, timestamp: new Date().toISOString(), read: false };
      const n = [u, ...s.updates];
      localStorage.setItem('apex_system_updates', JSON.stringify(n));
      return { updates: n };
  }),
  updateEmployee: (id, u) => set(s => {
      const n = s.employees.map(e => e.id === id ? { ...e, ...u } : e);
      localStorage.setItem('apex_employees', JSON.stringify(n));
      return { employees: n };
  }),
  updateBadge: (id, data, actor) => set(s => {
      const emp = s.employees.find(e => e.id === id);
      if (!emp) return {};
      const newAudit: AuditEntry = { date: new Date().toISOString(), action: 'Badge Update', user: actor };
      const updatedEmp = { ...emp, ...data, badgeDataStatus: 'PENDING' as OnboardingStatus, auditLog: [...emp.auditLog, newAudit] };
      const n = s.employees.map(e => e.id === id ? updatedEmp : e);
      localStorage.setItem('apex_employees', JSON.stringify(n));
      return { employees: n };
  }),
  reviewSection: (adminId, employeeId, section, status, reason) => set(s => {
      const emp = s.employees.find(e => e.id === employeeId);
      if (!emp) return {};
      let updates: Partial<Employee> = {};
      if (section === 'personal') updates = { personalInfoStatus: status, personalInfoReason: reason };
      if (section === 'id') updates = { idCardStatus: status, idCardReason: reason };
      if (section === 'badge') updates = { badgeDataStatus: status, badgeReason: reason };
      
      const newAudit: AuditEntry = { date: new Date().toISOString(), action: `${section} Review: ${status}`, user: adminId, reason };
      updates.auditLog = [...emp.auditLog, newAudit];
      
      const n = s.employees.map(e => e.id === employeeId ? { ...e, ...updates } : e);
      localStorage.setItem('apex_employees', JSON.stringify(n));
      return { employees: n };
  }),
  applyForShift: (criteria, agentId) => {
      const hash = btoa(JSON.stringify(criteria));
      const agent = get().employees.find(e => e.id === agentId);
      const matchingShift = get().shifts.find(s => s.clientName === criteria.c && s.location === criteria.l && s.startTime === criteria.s && s.endTime === criteria.e);
      const newApp: ShiftApplication = {
          id: `APP-${Date.now()}-${agentId}`,
          shiftGroupHash: hash,
          groupId: matchingShift?.groupId,
          agentId,
          agentName: agent?.name || 'Onbekende Agent',
          status: 'PENDING',
          createdAt: new Date().toISOString()
      };
      set(s => {
          const n = [...s.applications, newApp];
          localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(n));
          return { applications: n };
      });
      get().addUpdate(`${agent?.name} heeft zich opgegeven voor ${criteria.c}`, 'planning');
  },
  withdrawApplication: (applicationId) => set(s => {
      const n = s.applications.map(a => a.id === applicationId ? { ...a, status: 'WITHDRAWN' as ApplicationStatus } : a);
      localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(n));
      return { applications: n };
  }),
  approveApplication: (applicationId, adminId) => {
      const app = get().applications.find(a => a.id === applicationId);
      if (!app || app.status !== 'PENDING') return { success: false, error: 'Aanvraag niet gevonden.' };
      let openSlots: Shift[] = [];
      if (app.groupId) {
          openSlots = get().shifts.filter(s => s.groupId === app.groupId && (!s.employeeId || s.employeeId === ''));
      }
      if (openSlots.length === 0) {
          try { 
              const criteria = JSON.parse(atob(app.shiftGroupHash)); 
              openSlots = get().shifts.filter(s => s.clientName === criteria.c && s.location === criteria.l && s.startTime === criteria.s && s.endTime === criteria.e && (!s.employeeId || s.employeeId === ''));
          } catch(e) { return { success: false, error: 'Corrupte aanvraag data.' }; }
      }
      if (openSlots.length === 0) return { success: false, error: 'Geen vrije plaatsen of shift niet gevonden.' };
      const targetShiftId = openSlots[0].id;
      set(s => {
          const newApps = s.applications.map(a => a.id === applicationId ? { ...a, status: 'APPROVED' as ApplicationStatus, decidedAt: new Date().toISOString(), decidedBy: adminId } : a);
          const newShifts = s.shifts.map(sh => sh.id === targetShiftId ? { ...sh, employeeId: app.agentId } : sh);
          localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(newApps));
          localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
          return { applications: newApps, shifts: newShifts };
      });
      return { success: true };
  },
  rejectApplication: (applicationId, adminId, reason) => set(s => {
      const newApps = s.applications.map(a => a.id === applicationId ? { ...a, status: 'REJECTED' as ApplicationStatus, decidedAt: new Date().toISOString(), decidedBy: adminId, note: reason } : a);
      localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(newApps));
      return { applications: newApps };
  }),
  claimShift: (criteria, agentId) => {
    const state = get();
    const openSlot = state.shifts.find(s =>
      s.clientName === criteria.c && s.location === criteria.l &&
      s.startTime === criteria.s && s.endTime === criteria.e &&
      (!s.employeeId || s.employeeId === '')
    );
    if (!openSlot) return false;
    set(s => {
      const newShifts = s.shifts.map(sh =>
        sh.id === openSlot.id ? { ...sh, employeeId: agentId } : sh
      );
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
    });
    return true;
  },
  unclaimShift: (criteria, agentId) => set(s => {
      const newShifts = s.shifts.map(sh => (
          sh.clientName === criteria.c && sh.location === criteria.l && 
          sh.startTime === criteria.s && sh.endTime === criteria.e && 
          sh.employeeId === agentId
      ) ? { ...sh, employeeId: '' } : sh);
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  }),
  runDailyBadgeCheck: () => {
    const { employees, updates, addUpdate } = get();
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    employees.filter(e => e.status === 'Active' && e.badgeExpiry).forEach(emp => {
      const expiry = new Date(emp.badgeExpiry!);
      const alreadyNotified = updates.some(u =>
        u.type === 'badge' && u.text.includes(emp.name) &&
        new Date(u.timestamp) > new Date(today.getTime() - 24 * 60 * 60 * 1000)
      );
      if (alreadyNotified) return;
      if (expiry < today) {
        addUpdate(`Badge van ${emp.name} is VERLOPEN (${emp.badgeExpiry})`, 'badge');
      } else if (expiry <= in30Days) {
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        addUpdate(`Badge van ${emp.name} vervalt over ${diffDays} dag(en) (${emp.badgeExpiry})`, 'badge');
      }
    });
  },
  createShifts: (newShifts) => set(state => {
      const updated = [...state.shifts, ...newShifts];
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(updated));
      return { shifts: updated };
  }),
  updateShift: (id, updates) => set(state => {
      const newShifts = state.shifts.map(s => s.id === id ? { ...s, ...updates } : s);
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  }),
  updateShiftGroup: (ids, updates) => set(state => {
      const idSet = new Set(ids);
      const newShifts = state.shifts.map(s => idSet.has(s.id) ? { ...s, ...updates } : s);
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  }),
  deleteShift: (id) => set(state => {
      const hasLogs = state.timeLogs.some(l => l.shiftId === id);
      let newShifts;
      if (hasLogs) {
          newShifts = state.shifts.map(s => s.id === id ? { ...s, status: 'Cancelled' as const, cancelledAt: new Date().toISOString(), cancelledBy: 'Admin' } : s);
      } else {
          newShifts = state.shifts.filter(s => s.id !== id);
      }
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  }),
  deleteGroup: (groupId) => set(state => {
      const groupShifts = state.shifts.filter(s => s.groupId === groupId);
      const groupShiftIds = groupShifts.map(s => s.id);
      const hasLogs = state.timeLogs.some(l => groupShiftIds.includes(l.shiftId));
      let newShifts;
      if (hasLogs) {
          newShifts = state.shifts.map(s => s.groupId === groupId ? { ...s, status: 'Cancelled' as const, cancelledAt: new Date().toISOString(), cancelledBy: 'Admin' } : s);
      } else {
          newShifts = state.shifts.filter(s => s.groupId !== groupId);
      }
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      const newApps = state.applications.map(app => {
          if (app.groupId === groupId && app.status === 'PENDING') {
              return { ...app, status: 'REJECTED' as ApplicationStatus, note: 'Opdracht geannuleerd/verwijderd door admin', decidedAt: new Date().toISOString(), decidedBy: 'System' };
          }
          return app;
      });
      localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(newApps));
      return { shifts: newShifts, applications: newApps };
  }),
  approveShift: (shiftId, adminId) => set(state => {
      const shift = state.shifts.find(s => s.id === shiftId);
      if (!shift) return {};
      const updatedShift = {
          ...shift,
          status: 'Approved' as const,
          auditLog: [...(shift.auditLog || []), { date: new Date().toISOString(), action: 'Approved', user: adminId }]
      };
      const newShifts = state.shifts.map(s => s.id === shiftId ? updatedShift : s);
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  }),
  rejectShift: (shiftId, adminId, reason) => set(state => {
      const shift = state.shifts.find(s => s.id === shiftId);
      if (!shift) return {};
      const updatedShift = {
          ...shift,
          status: 'Rejected' as const,
          auditLog: [...(shift.auditLog || []), { date: new Date().toISOString(), action: 'Rejected', user: adminId, reason }]
      };
      const newShifts = state.shifts.map(s => s.id === shiftId ? updatedShift : s);
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  })
}));
