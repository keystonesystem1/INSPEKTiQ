export type Role =
  | 'super_admin'
  | 'firm_admin'
  | 'examiner'
  | 'dispatcher'
  | 'adjuster'
  | 'carrier';

export type ClaimStatus =
  | 'received'
  | 'assigned'
  | 'scheduled'
  | 'inspected'
  | 'in_review'
  | 'approved'
  | 'submitted'
  | 'closed'
  | 'on_hold';

export type BadgeTone = 'sage' | 'blue' | 'orange' | 'red' | 'bronze' | 'faint';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  firmName: string;
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
  insured: string;
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
  insured: string;
  address: string;
  date: string;
  arrivalTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  adjuster: string;
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
