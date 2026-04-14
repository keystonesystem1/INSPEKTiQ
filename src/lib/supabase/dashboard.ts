import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ACTIVE_STATUSES = [
  'received',
  'assigned',
  'accepted',
  'contact_attempted',
  'contacted',
  'scheduled',
  'inspection_started',
  'inspection_completed',
  'in_review',
  'approved',
  'on_hold',
  'needs_attention',
  'pending_te',
  'pending_carrier_direction',
  'pending_engineer',
];

export async function getDashboardStats(firmId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('claims')
    .select('status, created_at')
    .eq('firm_id', firmId)
    .eq('is_archived', false);

  const claims = data ?? [];
  const slaWindowMs = 24 * 60 * 60 * 1000;
  const slaWarnMs = 20 * 60 * 60 * 1000; // warn at 20 hours
  const now = Date.now();

  return {
    active: claims.filter((claim) => ACTIVE_STATUSES.includes(claim.status ?? '')).length,
    unassigned: claims.filter((claim) => claim.status === 'received').length,
    newToday: claims.filter((claim) => {
      const created = new Date(claim.created_at ?? '');
      const today = new Date();
      return created.toDateString() === today.toDateString();
    }).length,
    slaAtRisk: claims.filter((claim) => {
      if (claim.status !== 'received') return false;
      const age = now - new Date(claim.created_at ?? '').getTime();
      return age >= slaWarnMs && age < slaWindowMs;
    }).length,
  };
}

interface RawAppointmentRow {
  id: string;
  claim_id: string;
  date: string;
  arrival_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface RawClaimRow {
  id: string;
  claim_number: string | null;
  insured_name: string | null;
  loss_address: string | null;
  carrier: string | null;
  loss_type: string | null;
  status: string | null;
  assigned_user_id: string | null;
  created_at: string | null;
}

export interface AdjusterDashboardData {
  activeClaims: Array<{
    id: string;
    number: string;
    insured: string;
    address: string;
    carrier: string;
    type: string;
    status: string;
  }>;
  todayAppointments: Array<{
    id: string;
    claimId: string;
    date: string;
    arrivalTime: string;
    endTime: string;
    status: string;
    insuredName: string;
    lossAddress: string;
  }>;
  stats: {
    active: number;
    completedThisWeek: number;
    slaAtRisk: number;
  };
}

export async function getAdjusterDashboardData(firmId: string, adjusterUserId: string): Promise<AdjusterDashboardData> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [{ data: claimRows }, { data: appointmentRows }] = await Promise.all([
    supabase
      .from('claims')
      .select('id, claim_number, insured_name, loss_address, carrier, loss_type, status, assigned_user_id, created_at')
      .eq('firm_id', firmId)
      .eq('assigned_user_id', adjusterUserId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('id, claim_id, date, arrival_time, end_time, status, notes')
      .eq('firm_id', firmId)
      .eq('adjuster_user_id', adjusterUserId)
      .eq('date', today)
      .neq('status', 'cancelled'),
  ]);

  const claims = (claimRows ?? []) as RawClaimRow[];
  const appointments = (appointmentRows ?? []) as RawAppointmentRow[];
  const claimById = new Map(claims.map((c) => [c.id, c]));

  const activeClaims = claims
    .filter((c) => ACTIVE_STATUSES.includes(c.status ?? ''))
    .map((c) => ({
      id: c.id,
      number: c.claim_number ?? '—',
      insured: c.insured_name ?? 'Unknown',
      address: c.loss_address ?? '',
      carrier: c.carrier ?? '',
      type: c.loss_type ?? '',
      status: c.status ?? '',
    }));

  const completedThisWeek = claims.filter(
    (c) => c.status === 'submitted' || c.status === 'closed',
  ).filter((c) => {
    const d = c.created_at ?? '';
    return d >= weekAgo;
  }).length;

  const slaWindowMs = 24 * 60 * 60 * 1000;
  const slaWarnMs = 20 * 60 * 60 * 1000;
  const now = Date.now();
  const slaAtRisk = activeClaims.filter((c) => {
    const raw = claims.find((r) => r.id === c.id);
    if (!raw?.created_at) return false;
    const age = now - new Date(raw.created_at).getTime();
    return age >= slaWarnMs && age < slaWindowMs;
  }).length;

  return {
    activeClaims,
    todayAppointments: appointments.map((a) => ({
      id: a.id,
      claimId: a.claim_id,
      date: a.date,
      arrivalTime: a.arrival_time.slice(0, 5),
      endTime: a.end_time.slice(0, 5),
      status: a.status,
      insuredName: claimById.get(a.claim_id)?.insured_name ?? '—',
      lossAddress: claimById.get(a.claim_id)?.loss_address ?? '',
    })),
    stats: {
      active: activeClaims.length,
      completedThisWeek,
      slaAtRisk,
    },
  };
}

export interface DispatcherDashboardData {
  unassignedClaims: Array<{
    id: string;
    number: string;
    insured: string;
    address: string;
    carrier: string;
    type: string;
    createdAt: string;
  }>;
  stats: {
    unassigned: number;
    scheduledToday: number;
    availableAdjusters: number;
  };
}

export async function getDispatcherDashboardData(firmId: string): Promise<DispatcherDashboardData> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const [{ data: claimRows }, { data: appointmentRows }, { data: adjusterRows }] = await Promise.all([
    supabase
      .from('claims')
      .select('id, claim_number, insured_name, loss_address, carrier, loss_type, status, created_at')
      .eq('firm_id', firmId)
      .eq('is_archived', false)
      .eq('status', 'received')
      .order('created_at', { ascending: true })
      .limit(20),
    supabase
      .from('appointments')
      .select('id')
      .eq('firm_id', firmId)
      .eq('date', today)
      .neq('status', 'cancelled'),
    supabase
      .from('adjuster_profiles')
      .select('availability')
      .eq('firm_id', firmId)
      .eq('availability', 'available'),
  ]);

  const claims = (claimRows ?? []) as Array<{
    id: string; claim_number: string | null; insured_name: string | null;
    loss_address: string | null; carrier: string | null; loss_type: string | null;
    status: string | null; created_at: string | null;
  }>;

  return {
    unassignedClaims: claims.map((c) => ({
      id: c.id,
      number: c.claim_number ?? '—',
      insured: c.insured_name ?? 'Unknown',
      address: c.loss_address ?? '',
      carrier: c.carrier ?? '',
      type: c.loss_type ?? '',
      createdAt: c.created_at ?? '',
    })),
    stats: {
      unassigned: claims.length,
      scheduledToday: (appointmentRows ?? []).length,
      availableAdjusters: (adjusterRows ?? []).length,
    },
  };
}

export interface ExaminerDashboardData {
  reviewQueue: Array<{
    id: string;
    number: string;
    insured: string;
    address: string;
    carrier: string;
    status: string;
  }>;
  stats: {
    awaitingReview: number;
    approvedThisWeek: number;
  };
}

export async function getExaminerDashboardData(firmId: string): Promise<ExaminerDashboardData> {
  const supabase = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: reviewRows }, { data: approvedRows }] = await Promise.all([
    supabase
      .from('claims')
      .select('id, claim_number, insured_name, loss_address, carrier, status')
      .eq('firm_id', firmId)
      .eq('is_archived', false)
      .in('status', ['in_review', 'inspection_completed'])
      .order('created_at', { ascending: true })
      .limit(20),
    supabase
      .from('claims')
      .select('id')
      .eq('firm_id', firmId)
      .in('status', ['approved', 'submitted'])
      .gte('created_at', weekAgo),
  ]);

  const claims = (reviewRows ?? []) as Array<{
    id: string; claim_number: string | null; insured_name: string | null;
    loss_address: string | null; carrier: string | null; status: string | null;
  }>;

  return {
    reviewQueue: claims.map((c) => ({
      id: c.id,
      number: c.claim_number ?? '—',
      insured: c.insured_name ?? 'Unknown',
      address: c.loss_address ?? '',
      carrier: c.carrier ?? '',
      status: c.status ?? '',
    })),
    stats: {
      awaitingReview: claims.length,
      approvedThisWeek: (approvedRows ?? []).length,
    },
  };
}
