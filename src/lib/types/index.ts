export type Role =
  | 'super_admin'
  | 'firm_admin'
  | 'examiner'
  | 'dispatcher'
  | 'adjuster'
  | 'carrier'
  | 'carrier_admin'
  | 'carrier_desk_adjuster';

export type ClaimContactKind = 'contractor' | 'public_adjuster' | 'other';

export interface ClaimContactEntry {
  id: string;
  kind: ClaimContactKind;
  label?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
}

export interface ClaimContactsData {
  adjuster: { name: string; email: string; phone: string | null } | null;
  examiner: { name: string; email: string | null } | null;
  carrierDeskAdjusters: Array<{ firmUserId: string; name: string; email: string }>;
  insured: { name: string; phone: string; email: string };
  editableContacts: ClaimContactEntry[];
}

export interface CarrierPortalUser {
  userId: string;
  firmUserId: string;
  name: string | null;
  email: string;
  role: 'carrier_admin' | 'carrier_desk_adjuster';
  inviteStatus: 'pending' | 'accepted';
}

export interface CarrierRow {
  id: string;
  firmId: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  billingPreference: 'desk_adjuster' | 'billing_contact';
  billingContactName: string | null;
  billingContactEmail: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZip: string | null;
  portalEnabled: boolean;
  inviteStatus: 'not_invited' | 'pending' | 'accepted';
  logoUrl: string | null;
  notes: string | null;
  guidelinesUrl: string | null;
  guidelinesNotes: string | null;
  isActive: boolean;
  createdAt: string;
  activeClaims: number;
  totalClaims: number;
  portalUsers: CarrierPortalUser[];
}

export interface CarrierCreate {
  name: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  billingPreference: 'desk_adjuster' | 'billing_contact';
  billingContactName?: string;
  billingContactEmail?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  notes?: string;
  guidelinesUrl?: string;
  guidelinesNotes?: string;
}

export type ClaimStatus =
  | 'pending_acceptance'
  | 'received'
  | 'assigned'
  | 'accepted'
  | 'contacted'
  | 'scheduled'
  | 'inspected'
  | 'in_review'
  | 'approved'
  | 'submitted'
  | 'closed'
  | 'on_hold'
  | 'pending_te'
  | 'pending_carrier_direction'
  | 'pending_engineer'
  | 'needs_attention';

export type BadgeTone = 'sage' | 'blue' | 'orange' | 'red' | 'bronze' | 'faint';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  firmName: string;
  firmId?: string;
  role: Role;
}

export interface ActivityItem {
  id: string;
  tone: BadgeTone;
  text: string;
  meta: string;
  time: string;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
  accent: string;
  trend?: string;
}

export interface Claim {
  id: string;
  number: string;
  isArchived: boolean;
  insured: string;
  insuredPhone?: string;
  insuredEmail?: string;
  client: string;
  type: string;
  category: string;
  dateOfLoss: string;
  dueDate: string;
  status: ClaimStatus;
  adjuster?: string;
  examiner?: string;
  carrier?: string;
  city: string;
  state: string;
  zip?: string;
  address: string;
  slaHoursRemaining: number;
  policyNumber: string;
  lossCause: string;
  notesCount: number;
  photosCount: number;
  reserveTotal: number;
  lat: number;
  lng: number;
  milestones: Partial<Record<MilestoneKey, string>>;
}

export type MilestoneKey =
  | 'received'
  | 'assigned'
  | 'accepted'
  | 'contacted'
  | 'scheduled'
  | 'inspected'
  | 'in_review'
  | 'approved'
  | 'submitted'
  | 'closed';

export interface Appointment {
  id: string;
  claimId: string;
  firmId: string;
  adjusterUserId: string | null;
  date: string;
  arrivalTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'needs_attention' | 'cancelled';
  notes: string | null;
  insuredName: string;
  lossAddress: string;
  city: string;
  state: string;
  lossType: string;
  lossLat: number | null;
  lossLng: number | null;
  adjusterName: string;
  insured?: string;
  address?: string;
  adjuster?: string;
}

export interface SchedulingQueueItem {
  id: string;
  claimNumber: string;
  insuredName: string;
  lossAddress: string;
  city: string;
  state: string;
  carrier: string;
  lossType: string;
  claimCategory: 'Residential' | 'Commercial' | 'Farm/Ranch' | 'Industrial';
  status: string;
  receivedAt: string;
  slaDeadlineHours: number | null;
  lossLat: number | null;
  lossLng: number | null;
}

export interface DispatchClaim {
  id: string;
  claimNumber: string;
  insuredName: string;
  lossAddress: string;
  city: string;
  state: string;
  zip: string;
  carrier: string;
  lossType: string;
  claimCategory: string;
  requiresTwia: boolean;
  requiredCerts: string[];
  status: string;
  appointmentStatus: string | null;
  receivedAt: string;
  slaDeadlineHours: number | null;
  lossLat: number | null;
  lossLng: number | null;
}

export interface DispatchAdjuster {
  id: string;
  name: string;
  initials: string;
  location: string;
  activeClaims: number;
  maxClaims: number;
  availability: 'available' | 'busy' | 'remote' | 'on_leave';
  approvedCarriers: string[];
  approvedClaimTypes: string[];
  certifications: string[];
  homeLat: number | null;
  homeLng: number | null;
}

export interface AdjusterHomeBase {
  name: string;
  address?: string;
  formattedAddress?: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
}

export interface AdjusterRow {
  userId: string;
  firmUserId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  displayName: string;
  initials: string;
  email: string;
  isActive: boolean;
  role: string;
  invitedAt: string | null;
  joinedAt: string | null;
  maxActiveClaims: number;
  certifications: string[];
  approvedClaimTypes: string[];
  approvedCarriers: string[];
  homeBases: AdjusterHomeBase[];
  availability: 'available' | 'busy' | 'remote' | 'on_leave';
  activeClaims: number;
  profileComplete: boolean;
}

export interface AdjusterProfileUpdate {
  maxActiveClaims: number;
  certifications: string[];
  approvedClaimTypes: string[];
  approvedCarriers: string[];
  homeBases: AdjusterHomeBase[];
  availability: 'available' | 'busy' | 'remote' | 'on_leave';
}

export interface AdjusterUserUpdate {
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface AdjusterProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  status: 'Active' | 'Invited' | 'Inactive' | 'On Leave';
  location: string;
  activeClaims: number;
  maxClaims: number;
  completed: number;
  avgSla: string;
  paidYtd: string;
  avgPerClaim: string;
  certifications: string[];
  approvedClaimTypes: string[];
  approvedCarriers: string[];
  homeBases: string[];
  lat: number;
  lng: number;
}

export interface ClientRecord {
  id: string;
  name: string;
  primaryContact: string;
  activeStates: string[];
  openClaims: number;
  feeBill: string;
  guidelines: string;
}

export interface Invoice {
  id: string;
  date: string;
  claimNumber: string;
  insured: string;
  invoiceType: string;
  commission: string;
  serviceFee: string;
  mileage: string;
  other: string;
  totalDue: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Disputed';
}

export interface TimelineItem {
  id: string;
  tone: BadgeTone;
  action: string;
  who: string;
  timestamp: string;
}

export interface NoteItem {
  id: string;
  type: 'internal' | 'shared' | 'system';
  author: string;
  initials: string;
  timestamp: string;
  content: string;
}

export interface DashboardData {
  greeting: string;
  subtitle: string;
  stats: StatItem[];
  activity: ActivityItem[];
}
