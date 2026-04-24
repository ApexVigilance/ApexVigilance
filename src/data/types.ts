
export type UserRole = 'admin' | 'agent';

export interface AuditEntry {
  date: string;
  action: string;
  reason?: string;
  user: string;
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type OnboardingStatus = 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShiftApplication {
  id: string;
  shiftGroupHash: string; // Legacy / Fallback linkage
  groupId?: string;       // NEW: Stable linkage ID
  agentId: string;
  agentName: string;
  status: ApplicationStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
}

export interface SystemUpdate {
  id: string;
  text: string;
  type: 'planning' | 'instructie' | 'verlof' | 'certificaat' | 'algemeen' | 'badge';
  timestamp: string;
  read?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Guard' | 'Senior' | 'Supervisor' | 'PlanningMaster' | 'Coordinator' | 'Admin';
  status: 'Active' | 'Inactive';
  email?: string;
  phone?: string;
  address?: string;
  nationalRegisterNr?: string;
  languages?: string[];
  contractType?: string;
  hourlyRate?: number;
  badgeNr?: string;
  badgeExpiry?: string;
  badgePhotoUrl?: string;
  personalInfoStatus: OnboardingStatus;
  idCardStatus: OnboardingStatus;
  badgeDataStatus: OnboardingStatus;
  certificates?: string[];
  auditLog: AuditEntry[];
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  emergencyContact?: string;
  idCardRectoUrl?: string;
  idCardVersoUrl?: string;
  personalInfoReason?: string;
  idCardReason?: string;
  badgeReason?: string;
  portalUsername?: string;
  portalPassword?: string;
}

export type DayType = 'Week' | 'Zaterdag' | 'Zondag' | 'Feestdag';
export type ServiceType = 'Statisch' | 'Winkel' | 'Werf' | 'Event' | 'Haven' | 'Ziekenhuis' | 'Overig';

export interface ShiftRequest {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  location: string;
  serviceType: ServiceType;
  guards: number;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  rejectReason?: string;
}

export interface Shift {
  id: string;
  groupId: string;
  clientId?: string; // Added for reliable linking
  clientName: string;
  location: string;
  startTime: string;
  endTime: string;
  employeeId: string;
  status: 'Scheduled' | 'Submitted' | 'Approved' | 'Rejected' | 'Active' | 'Completed' | 'Cancelled';
  serviceType?: ServiceType;
  requiredRole?: 'Guard' | 'Senior';
  requiredCertificates?: string[];
  exeCode?: string;
  briefing?: string;
  geoLat?: number;
  geoLng?: number;
  geoRadius?: number;
  cancelledAt?: string;
  cancelledBy?: string;
  auditLog?: AuditEntry[];
  invoiceId?: string; // Linked Invoice ID
  invoicedAt?: string; // Timestamp when invoiced
}

export type IncidentStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Archived';
export type IncidentType = 'Incident' | 'Complaint';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IncidentComment {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  date: string;
  status: IncidentStatus;
  photos: string[];
  comments: IncidentComment[];
  auditLog: AuditEntry[];
  type?: IncidentType;
  description?: string;
  shiftId?: string;
  clientId?: string;
  locationId?: string;
  authorId?: string;
  emailStatus?: 'NONE' | 'PENDING' | 'SENT' | 'FAILED';
  emailedAt?: string;
  emailError?: string;
  rejectedReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type FullIncident = Incident;

export interface Client {
  id: string;
  clientRef?: string;
  name: string;
  locations: number;
  contact: string;
  status: 'Active' | 'Inactive';
  email?: string;
  phone?: string;
  address?: string;
  billingAddress?: string;
  vat?: string;
  paymentTerms?: 15 | 30 | 45 | 60;
  contractNumber?: string;
  contractStart?: string;
  contractEnd?: string;
  hourlyRate?: number;
  notes?: string;
  contacts?: { name: string; role: string; email: string; phone: string }[];
  portalUsername?: string;
  portalPassword?: string;
}

export type FullClient = Client;

export interface ClientLocation {
  id: string;
  clientId: string;
  name: string;
  address: string;
  city: string;
  type: ServiceType;
  accessInfo?: string;
}

export type ReportType = 'Daily' | 'Incident' | 'Patrol' | 'Other';
export type ReportStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
export type ReportCategory = 'Overig' | 'Diefstal' | 'Vandalisme' | 'Agressie' | 'Ongeval' | 'Brand' | 'Verdachte_Persoon' | 'Toegang_Geweigerd';

export interface Report {
  id: string;
  type: ReportType;
  author: string;
  date: string;
  status: ReportStatus;
  images: string[];
  auditLog: AuditEntry[];
  title?: string;
  summary?: string;
  details?: string;
  shiftId?: string;
  locationId?: string;
  authorId?: string;
  category?: ReportCategory;
  severity?: IncidentSeverity;
  actionsTaken?: string[];
  involvedParties?: string;
  vehicleInfo?: string;
  supervisorFollowUp?: boolean;
  activities?: string;
  gpsLat?: number;
  gpsLng?: number;
  lastRejectedReason?: string;
  emailStatus?: 'NONE' | 'PENDING' | 'SENT' | 'FAILED';
}

export type FullReport = Report;

export type TimeEventType = 'INKLOK' | 'UITKLOK' | 'PAUZE_START' | 'PAUZE_STOP';
export type GeofenceStatus = 'BINNEN_ZONE' | 'BUITEN_ZONE' | 'NIET_GECONTROLEERD' | 'LOCATIE_NIET_BESCHIKBAAR';
export type ReviewStatus = 'OK' | 'NAZICHT' | 'GOEDGEKEURD' | 'GEWEIGERD';

export interface TimeEvent {
  id: string;
  timeLogId: string;
  agentId: string;
  type: TimeEventType;
  timestamp: string;
  gpsLat?: number;
  gpsLng?: number;
  geofenceStatus: GeofenceStatus;
  bewijsFotoUrl?: string;
  redenAfwijking?: string;
  reviewStatus: ReviewStatus;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface TimeLog {
  id: string;
  shiftId: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'OK' | 'LATE' | 'EDITED' | 'ACTIVE';
  approvalStatus: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  deviationMinutes: number;
  correctionReason?: string;
  geoLat: number;
  geoLng: number;
  events: TimeEvent[];
  currentStatus: 'IN_DIENST' | 'PAUZE' | 'AFGEROND' | 'NIET_INGEKLOKT';
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface PricingConfig {
  matrix: Record<string, Record<string, number>>;
  nightFactor: number;
  vatRate: number;
  minHours: number;
  lastMinuteFactor: number;
  smtp: SmtpConfig;
  brevoApiKey?: string;
  brevoSenderEmail?: string;
  invoiceSequence: Record<number, number>;
  clientSequence?: Record<number, number>; 
}

export interface InvoiceOverride {
  shiftId: string;
  billableHours: number;
  correctionReason: string;
  isInvoiced: boolean;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalExcl: number;
  vatAmount: number;
  totalIncl: number;
}

export type InvoiceStatus = 'Concept' | 'Sent' | 'Paid';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RegistrationType = 'agent' | 'client';

export interface PendingRegistration {
  id: string;
  type: RegistrationType;
  status: RegistrationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  email: string;
  phone: string;
  address?: string;
  // Agent-specifiek
  firstName?: string;
  lastName?: string;
  languages?: string[];
  motivation?: string;
  // Klant-specifiek
  companyName?: string;
  contactPerson?: string;
  vat?: string;
  message?: string;
}

export interface Invoice {
  id: string;
  number: string;
  ogm: string; // Structured Communication (+++ 123/4567/89012 +++)
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientVat?: string;
  date: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  lines: InvoiceLine[];
  subtotalExcl: number;
  vatTotal: number;
  totalIncl: number;
  status: InvoiceStatus;
  locked: boolean; // Immutable flag
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  emailedAt?: string;
  emailStatus?: 'NONE' | 'PENDING' | 'SENT' | 'FAILED';
  auditLog: AuditEntry[];
}
