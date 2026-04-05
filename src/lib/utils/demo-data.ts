import type {
  ActivityItem,
  AdjusterProfile,
  Appointment,
  Claim,
  ClientRecord,
  DashboardData,
  Invoice,
  NoteItem,
  Role,
  TimelineItem,
} from '@/lib/types';

export const demoClaims: Claim[] = [
  {
    id: 'clm-1',
    number: 'TX-2401987',
    isArchived: false,
    insured: 'Miller Residence',
    client: 'Lone Star Mutual',
    type: 'Wind + Hail',
    category: 'Residential',
    dateOfLoss: '2026-04-01T10:00:00.000Z',
    dueDate: '2026-04-06T20:00:00.000Z',
    status: 'received',
    adjuster: 'Jordan Ames',
    examiner: 'Avery Stone',
    carrier: 'Lone Star Mutual',
    city: 'Plano',
    state: 'TX',
    address: '1420 Cottonwood Ct, Plano, TX',
    slaHoursRemaining: 10,
    policyNumber: 'LSM-883447',
    lossCause: 'Hail',
    notesCount: 12,
    photosCount: 84,
    reserveTotal: 18650,
    lat: 33.0198,
    lng: -96.6989,
    milestones: {
      received: '2026-04-01T10:00:00.000Z',
    },
  },
  {
    id: 'clm-2',
    number: 'TX-2401944',
    isArchived: false,
    insured: 'Pine Harbor Dental',
    client: 'Summit Commercial',
    type: 'Wind',
    category: 'Commercial',
    dateOfLoss: '2026-03-30T13:00:00.000Z',
    dueDate: '2026-04-04T18:00:00.000Z',
    status: 'in_review',
    adjuster: 'Maya Quinn',
    examiner: 'Avery Stone',
    carrier: 'Summit Commercial',
    city: 'Dallas',
    state: 'TX',
    address: '4802 Preston Rd, Dallas, TX',
    slaHoursRemaining: -6,
    policyNumber: 'SC-144210',
    lossCause: 'Wind',
    notesCount: 8,
    photosCount: 46,
    reserveTotal: 42800,
    lat: 32.8259,
    lng: -96.7904,
    milestones: {
      received: '2026-03-30T13:00:00.000Z',
      accepted: '2026-03-30T16:10:00.000Z',
      contacted: '2026-03-31T14:15:00.000Z',
      scheduled: '2026-04-01T17:00:00.000Z',
      inspected: '2026-04-02T21:30:00.000Z',
      in_review: '2026-04-03T12:00:00.000Z',
    },
  },
  {
    id: 'clm-3',
    number: 'TX-2401931',
    isArchived: false,
    insured: 'Rodriguez Farm',
    client: 'AgriSure',
    type: 'Flood',
    category: 'Farm/Ranch',
    dateOfLoss: '2026-03-29T14:30:00.000Z',
    dueDate: '2026-04-07T19:00:00.000Z',
    status: 'scheduled',
    adjuster: 'Jordan Ames',
    examiner: 'Nina Price',
    carrier: 'AgriSure',
    city: 'Waxahachie',
    state: 'TX',
    address: '815 FM 55, Waxahachie, TX',
    slaHoursRemaining: 44,
    policyNumber: 'AS-446790',
    lossCause: 'Flood',
    notesCount: 5,
    photosCount: 0,
    reserveTotal: 73200,
    lat: 32.355,
    lng: -96.8483,
    milestones: {
      received: '2026-03-29T14:30:00.000Z',
      accepted: '2026-03-29T18:00:00.000Z',
      contacted: '2026-03-30T13:20:00.000Z',
      scheduled: '2026-04-05T15:00:00.000Z',
    },
  },
];

export const demoAdjusters: AdjusterProfile[] = [
  {
    id: 'adj-1',
    name: 'Jordan Ames',
    initials: 'JA',
    email: 'jordan@keystoneclaims.io',
    status: 'Active',
    location: 'Plano, TX',
    activeClaims: 7,
    maxClaims: 10,
    completed: 38,
    avgSla: '94%',
    paidYtd: '$44,870',
    avgPerClaim: '$1,182',
    certifications: ['TWIA', 'Flood Cert', 'Drone'],
    approvedClaimTypes: ['Residential', 'Commercial', 'Flood'],
    approvedCarriers: ['Lone Star Mutual', 'AgriSure'],
    homeBases: ['Plano Home', 'McKinney Hotel'],
    lat: 33.0151,
    lng: -96.7053,
  },
  {
    id: 'adj-2',
    name: 'Maya Quinn',
    initials: 'MQ',
    email: 'maya@keystoneclaims.io',
    status: 'Active',
    location: 'Dallas, TX',
    activeClaims: 4,
    maxClaims: 8,
    completed: 22,
    avgSla: '98%',
    paidYtd: '$31,440',
    avgPerClaim: '$1,429',
    certifications: ['Commercial Lic', 'TWIA'],
    approvedClaimTypes: ['Commercial', 'Industrial'],
    approvedCarriers: ['Summit Commercial', 'Lone Star Mutual'],
    homeBases: ['Dallas Home'],
    lat: 32.7767,
    lng: -96.797,
  },
];

export const demoAppointments: Appointment[] = [
  {
    id: 'apt-1',
    claimId: 'clm-3',
    firmId: 'firm-demo',
    adjusterUserId: 'adj-1',
    date: '2026-04-05',
    arrivalTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    notes: null,
    insuredName: 'Rodriguez Farm',
    lossAddress: '815 FM 55, Waxahachie, TX',
    city: 'Waxahachie',
    state: 'TX',
    lossType: 'Flood',
    lossLat: 32.355,
    lossLng: -96.8483,
    adjusterName: 'Jordan Ames',
    insured: 'Rodriguez Farm',
    address: '815 FM 55, Waxahachie, TX',
    adjuster: 'Jordan Ames',
  },
  {
    id: 'apt-2',
    claimId: 'clm-2',
    firmId: 'firm-demo',
    adjusterUserId: 'adj-2',
    date: '2026-04-06',
    arrivalTime: '13:30',
    endTime: '15:00',
    status: 'pending',
    notes: null,
    insuredName: 'Pine Harbor Dental',
    lossAddress: '4802 Preston Rd, Dallas, TX',
    city: 'Dallas',
    state: 'TX',
    lossType: 'Wind',
    lossLat: 32.8259,
    lossLng: -96.7904,
    adjusterName: 'Maya Quinn',
    insured: 'Pine Harbor Dental',
    address: '4802 Preston Rd, Dallas, TX',
    adjuster: 'Maya Quinn',
  },
];

export const demoClients: ClientRecord[] = [
  {
    id: 'client-1',
    name: 'Lone Star Mutual',
    primaryContact: 'Hannah Price',
    activeStates: ['TX', 'OK'],
    openClaims: 18,
    feeBill: '2026 Field Fee Schedule',
    guidelines: 'Wind/Hail Desk Guide',
  },
  {
    id: 'client-2',
    name: 'Summit Commercial',
    primaryContact: 'Derrick Hall',
    activeStates: ['TX', 'LA', 'AR'],
    openClaims: 12,
    feeBill: 'Large Loss Commercial',
    guidelines: 'GLR Reporting Spec',
  },
];

export const demoInvoices: Invoice[] = [
  {
    id: 'inv-1',
    date: '2026-04-03',
    claimNumber: 'TX-2401944',
    insured: 'Pine Harbor Dental',
    invoiceType: 'Commercial',
    commission: '18%',
    serviceFee: '$1,450',
    mileage: '$84',
    other: '$120',
    totalDue: '$1,654',
    status: 'Pending',
  },
  {
    id: 'inv-2',
    date: '2026-04-02',
    claimNumber: 'TX-2401909',
    insured: 'Garcia Residence',
    invoiceType: 'Residential',
    commission: '16%',
    serviceFee: '$880',
    mileage: '$42',
    other: '$0',
    totalDue: '$922',
    status: 'Approved',
  },
];

export const demoNotes: NoteItem[] = [
  {
    id: 'note-1',
    type: 'shared',
    author: 'Jordan Ames',
    initials: 'JA',
    timestamp: '2026-04-03T15:15:00.000Z',
    content: 'First contact made with insured. Inspection window confirmed for Sunday morning.',
  },
  {
    id: 'note-2',
    type: 'internal',
    author: 'Avery Stone',
    initials: 'AS',
    timestamp: '2026-04-03T18:00:00.000Z',
    content: 'Desk review flagged gutter line measurements for follow-up after draft report.',
  },
];

export const demoTimeline: TimelineItem[] = [
  {
    id: 'tl-1',
    tone: 'sage',
    action: 'Inspection scheduled',
    who: 'Jordan Ames',
    timestamp: 'Apr 3, 4:10 PM',
  },
  {
    id: 'tl-2',
    tone: 'blue',
    action: 'Photos synced from INSPEKTiT',
    who: 'System',
    timestamp: 'Apr 3, 7:42 PM',
  },
  {
    id: 'tl-3',
    tone: 'orange',
    action: 'Report moved to in review',
    who: 'Avery Stone',
    timestamp: 'Apr 4, 9:04 AM',
  },
];

const sharedActivity: ActivityItem[] = [
  {
    id: 'act-1',
    tone: 'orange',
    text: 'Pine Harbor Dental exceeded review SLA threshold.',
    meta: 'Commercial wind claim · Examiner queue',
    time: '18m ago',
  },
  {
    id: 'act-2',
    tone: 'sage',
    text: 'Rodriguez Farm inspection locked in for Sunday.',
    meta: 'Confirmed by Jordan Ames',
    time: '43m ago',
  },
  {
    id: 'act-3',
    tone: 'blue',
    text: 'Three new Xactware intake emails parsed successfully.',
    meta: 'Lone Star Mutual · Summit Commercial',
    time: '1h ago',
  },
];

export function buildDashboardData(role: Role): DashboardData {
  const today = '2026-04-04T09:00:00.000Z';

  const common = {
    greeting: 'Good morning, Avery.',
    subtitle: 'Today, April 4, 2026 · Keystone Claims · Your daily brief is ready.',
    activity: sharedActivity,
  };

  switch (role) {
    case 'examiner':
      return {
        ...common,
        stats: [
          { id: '1', label: 'Awaiting Review', value: '11', accent: 'var(--orange)' },
          { id: '2', label: 'Approved This Week', value: '24', accent: 'var(--sage)' },
          { id: '3', label: 'Bills Pending', value: '7', accent: 'var(--border-hi)' },
        ],
      };
    case 'dispatcher':
      return {
        ...common,
        stats: [
          { id: '1', label: 'Unassigned', value: '9', accent: 'var(--orange)' },
          { id: '2', label: 'Scheduled Today', value: '14', accent: 'var(--blue)' },
          { id: '3', label: 'Available Adjusters', value: '6', accent: 'var(--sage)' },
        ],
      };
    case 'adjuster':
      return {
        ...common,
        stats: [
          { id: '1', label: 'Active Assignments', value: '7', accent: 'var(--blue)' },
          { id: '2', label: 'Completed This Week', value: '5', accent: 'var(--sage)' },
          { id: '3', label: 'SLA At-Risk', value: '2', accent: 'var(--orange)' },
        ],
      };
    case 'carrier':
      return {
        ...common,
        stats: [
          { id: '1', label: 'Open Claims', value: '21', accent: 'var(--blue)' },
          { id: '2', label: 'Reports Ready', value: '4', accent: 'var(--sage)' },
          { id: '3', label: 'Pending Inspection', value: '8', accent: 'var(--border-hi)' },
        ],
      };
    default:
      return {
        ...common,
        stats: [
          { id: '1', label: 'Active Claims', value: '68', accent: 'var(--blue)' },
          { id: '2', label: 'SLA At-Risk', value: '12', accent: 'var(--orange)' },
          { id: '3', label: 'Unassigned', value: '9', accent: 'var(--orange)' },
          { id: '4', label: 'New Today', value: '6', accent: 'var(--sage)' },
        ],
      };
  }
}
