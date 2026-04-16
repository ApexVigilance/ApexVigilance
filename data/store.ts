import { create } from 'zustand';
import { 
  Employee, Shift, Incident, Client, Report, PricingConfig, Invoice, TimeLog, 
  InvoiceOverride, FullReport, FullIncident, FullClient, ClientLocation, IncidentComment, SystemUpdate,
  AuditEntry, ReviewStatus, ShiftApplication, TimeEvent, OnboardingStatus, SmtpConfig, ApplicationStatus
} from './types';
import { SEED_EMPLOYEES, SEED_SHIFTS, SEED_INCIDENTS, SEED_CLIENTS, SEED_REPORTS, SEED_TIME_LOGS } from './seed';

export * from './types';

const KEYS = {
  PRICING: 'apex_billing_config_v1',
  LOGO: 'apex_brand_logo_v1',
  TEMPLATE: 'apex_invoice_template_v1',
  OVERRIDES: 'apex_billing_overrides_v1',
  INVOICES: 'apex_billing_invoices_v1',
  APPLICATIONS: 'apex_applications_v1',
  SHIFTS: 'apex_shifts_v1',
  TIMELOGS: 'apex_timelogs_v1',
  THEME: 'apex_theme_v1'
};

const loadFromStorage = <T>(key: string, seed: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : seed;
  } catch (e) {
    return seed;
  }
};

const defaultPricing: PricingConfig = {
  matrix: {
    'Statisch': { 'Week': 35, 'Zaterdag': 42, 'Zondag': 50, 'Feestdag': 70 },
    'Winkel': { 'Week': 38, 'Zaterdag': 45, 'Zondag': 55, 'Feestdag': 75 },
    'Werf': { 'Week': 40, 'Zaterdag': 48, 'Zondag': 60, 'Feestdag': 80 },
    'Event': { 'Week': 45, 'Zaterdag': 55, 'Zondag': 65, 'Feestdag': 90 },
    'Haven': { 'Week': 50, 'Zaterdag': 60, 'Zondag': 75, 'Feestdag': 100 },
    'Overig': { 'Week': 40, 'Zaterdag': 48, 'Zondag': 60, 'Feestdag': 80 }
  },
  nightFactor: 1.2,
  vatRate: 21,
  minHours: 3,
  lastMinuteFactor: 1.5,
  smtp: { host: '', port: 587, user: '', pass: '' },
  invoiceSequence: {} 
};

export const getGroupKey = (c:string, l:string, s:string, e:string) => btoa(JSON.stringify({c, l, s, e}));

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
  hydrateConfig: () => void;
  setLanguage: (lang: 'nl' | 'fr') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  billingReset: () => void;
  billingSetOverride: (shiftId: string, billableHours: number, reason: string) => void;
  billingMarkInvoiced: (shiftId: string, isInvoiced: boolean) => void;
  billingAddInvoice: (invoice: Invoice) => void;
  billingUpdateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  billingGetNextInvoiceNumber: () => string;
  savePricingConfig: (config: Partial<PricingConfig>) => void;
  saveSmtpConfig: (config: SmtpConfig) => void;
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
  addIncidentComment: (id: string, text: string) => void;
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
  brandLogoBase64: localStorage.getItem(KEYS.LOGO),
  invoiceTemplateBase64: localStorage.getItem(KEYS.TEMPLATE),
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (theme) => {
    localStorage.setItem(KEYS.THEME, theme);
    set({ theme });
  },
  hydrateConfig: () => {
      set({
          billingInvoices: loadFromStorage(KEYS.INVOICES, []),
          billingOverrides: loadFromStorage(KEYS.OVERRIDES, []),
          pricingConfig: loadFromStorage(KEYS.PRICING, defaultPricing),
          brandLogoBase64: localStorage.getItem(KEYS.LOGO),
          invoiceTemplateBase64: localStorage.getItem(KEYS.TEMPLATE),
          applications: loadFromStorage(KEYS.APPLICATIONS, []),
          shifts: loadFromStorage(KEYS.SHIFTS, SEED_SHIFTS),
          timeLogs: loadFromStorage(KEYS.TIMELOGS, SEED_TIME_LOGS)
      });
  },
  billingReset: () => set(state => {
      localStorage.removeItem(KEYS.INVOICES);
      localStorage.removeItem(KEYS.OVERRIDES);
      const resetPricing = { ...state.pricingConfig, invoiceSequence: {} };
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
          : [...s.billingOverrides, { shiftId, billableHours: 0, isInvoiced }];
      localStorage.setItem(KEYS.OVERRIDES, JSON.stringify(newOverrides));
      return { billingOverrides: newOverrides };
  }),
  billingAddInvoice: (invoice) => set(s => {
      const newInvoices = [invoice, ...s.billingInvoices];
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(newInvoices));
      return { billingInvoices: newInvoices };
  }),
  billingUpdateInvoiceStatus: (id, status) => set(s => {
      const newInvoices = s.billingInvoices.map(i => i.id === id ? { ...i, status, sentAt: status === 'Sent' ? new Date().toISOString() : i.sentAt } : i);
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
  saveBrandLogo: (base64) => {
      if (base64) localStorage.setItem(KEYS.LOGO, base64);
      else localStorage.removeItem(KEYS.LOGO);
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
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(n)); 
      return { timeLogs: n }; 
  }),
  createTimeLog: (log) => set(s => { 
      const n = [...s.timeLogs, log]; 
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(n)); 
      return { timeLogs: n }; 
  }),
  logTimeEvent: (id, ev) => set(s => { 
      const n = s.timeLogs.map(l => l.id === id ? { ...l, events: [...l.events, ev], currentStatus: ev.type === 'INKLOK' ? 'IN_DIENST' : ev.type === 'UITKLOK' ? 'AFGEROND' : ev.type === 'PAUZE_START' ? 'PAUZE' : 'IN_DIENST' } : l); 
      localStorage.setItem(KEYS.TIMELOGS, JSON.stringify(n)); 
      return { timeLogs: n }; 
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
  addIncidentComment: (id, text) => get().updateIncident(id, { comments: [...(get().incidents.find(i=>i.id===id)?.comments||[]), { id: Date.now().toString(), text, author: 'User', date: new Date().toISOString() }] }),
  createClient: (client) => set(s => {
      const n = [...s.clients, client];
      localStorage.setItem('apex_clients', JSON.stringify(n));
      return { clients: n };
  }),
  createLocation: (loc) => set(s => { 
      const n = [...s.locations, loc]; 
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
  applyForShift: (criteria, agentId) => {
      const hash = btoa(JSON.stringify(criteria));
      const agent = get().employees.find(e => e.id === agentId);
      const newApp: ShiftApplication = {
          id: `APP-${Date.now()}-${agentId}`,
          shiftGroupHash: hash,
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
      let criteria;
      try { criteria = JSON.parse(atob(app.shiftGroupHash)); } catch(e) { return { success: false }; }
      const openSlots = get().shifts.filter(s => 
          s.clientName === criteria.c && s.location === criteria.l && 
          s.startTime === criteria.s && s.endTime === criteria.e && 
          (!s.employeeId || s.employeeId === '')
      );
      if (openSlots.length === 0) return { success: false, error: 'Geen vrije plaatsen.' };
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
  unclaimShift: (criteria, agentId) => set(s => {
      const newShifts = s.shifts.map(sh => (
          sh.clientName === criteria.c && sh.location === criteria.l && 
          sh.startTime === criteria.s && sh.endTime === criteria.e && 
          sh.employeeId === agentId
      ) ? { ...sh, employeeId: '' } : sh);
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(newShifts));
      return { shifts: newShifts };
  }),
  runDailyBadgeCheck: () => {},
  notifyLate: () => {}, retryReportEmail: () => {}, retryIncidentEmail: () => {}, 
  updateClient: () => {}, toggleClientActive: () => {}, updateLocation: () => {}, 
  updateBadge: () => {}, reviewSection: () => {}, claimShift: () => true, updatePricingConfig: () => {}
}));