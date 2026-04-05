import { differenceInHours } from 'date-fns';
import { DEFAULT_SLA } from '@/lib/utils/sla';
import { createClient } from '@/lib/supabase/client';
import type { Appointment, SchedulingQueueItem } from '@/lib/types';

interface RawClaimRow {
  id: string;
  claim_number: string | null;
  insured_name: string | null;
  loss_address: string | null;
  city: string | null;
  state: string | null;
  carrier: string | null;
  loss_type: string | null;
  policy_type: string | null;
  status: string | null;
  received_at: string | null;
  created_at: string | null;
  loss_lat: number | null;
  loss_lng: number | null;
}

interface RawAppointmentRow {
  id: string;
  claim_id: string;
  firm_id: string;
  adjuster_user_id: string | null;
  date: string;
  arrival_time: string;
  end_time: string;
  status: Appointment['status'];
  notes: string | null;
}

function normalizeString(value: string | null | undefined, fallback = '') {
  return value?.trim() ?? fallback;
}

function getReceivedAt(claim: RawClaimRow) {
  return claim.received_at ?? claim.created_at ?? new Date().toISOString();
}

const BUSINESS_NAME_PATTERN =
  /\b(llc|inc|corp|company|co\.|church|baptist|school|apartments|apartments?|hoa|condo|center|centre|restaurant|hotel|roofing|construction|properties)\b/i;

function inferClaimCategory(claim: RawClaimRow): SchedulingQueueItem['claimCategory'] {
  // TODO: claim_category not in schema — derived field, needs migration.
  const policyType = normalizeString(claim.policy_type).toLowerCase();
  const insuredName = normalizeString(claim.insured_name);
  const lossType = normalizeString(claim.loss_type).toLowerCase();

  if (policyType.includes('farm') || lossType.includes('farm')) return 'Farm/Ranch';
  if (policyType.includes('industrial') || lossType.includes('industrial')) return 'Industrial';
  if (policyType.includes('commercial') || BUSINESS_NAME_PATTERN.test(insuredName)) return 'Commercial';
  return 'Residential';
}

function getSlaDeadlineHours(claim: RawClaimRow) {
  const receivedAt = getReceivedAt(claim);
  if (!receivedAt) {
    return null;
  }

  const dueAt = new Date(new Date(receivedAt).getTime() + DEFAULT_SLA.assigned_to_contacted * 60 * 60 * 1000);
  return differenceInHours(dueAt, new Date());
}

async function getAdjusterName(firmId: string, adjusterUserId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('firm_users')
    .select('full_name')
    .eq('firm_id', firmId)
    .eq('user_id', adjusterUserId)
    .maybeSingle();

  return normalizeString((data as { full_name?: string | null } | null)?.full_name, 'Adjuster');
}

async function getClaimsByIds(claimIds: string[]) {
  if (!claimIds.length) {
    return new Map<string, RawClaimRow>();
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('claims')
    .select('id, claim_number, insured_name, loss_address, city, state, carrier, loss_type, status, received_at, created_at, loss_lat, loss_lng')
    .in('id', claimIds);

  if (error || !data) {
    return new Map<string, RawClaimRow>();
  }

  return new Map((data as RawClaimRow[]).map((claim) => [claim.id, claim]));
}

export async function getClaimsNeedingScheduling(
  firmId: string,
  adjusterUserId: string,
): Promise<SchedulingQueueItem[]> {
  const supabase = createClient();
  const [{ data: claimRows, error: claimsError }, { data: appointmentRows, error: appointmentsError }] = await Promise.all([
    supabase
      .from('claims')
      .select('id, claim_number, insured_name, loss_address, city, state, carrier, loss_type, policy_type, status, received_at, created_at, loss_lat, loss_lng')
      .eq('firm_id', firmId)
      .eq('assigned_user_id', adjusterUserId)
      .in('status', ['assigned', 'accepted', 'contacted', 'needs_attention'])
      .order('received_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('appointments')
      .select('claim_id, status')
      .eq('firm_id', firmId)
      .eq('adjuster_user_id', adjusterUserId),
  ]);

  if (claimsError || appointmentsError || !claimRows) {
    return [];
  }

  const scheduledClaimIds = new Set(
    ((appointmentRows ?? []) as Array<{ claim_id: string; status: Appointment['status'] }>)
      .filter((appointment) => appointment.status !== 'cancelled')
      .map((appointment) => appointment.claim_id),
  );

  return (claimRows as RawClaimRow[])
    .filter((claim) => !scheduledClaimIds.has(claim.id))
    .map((claim) => ({
      id: claim.id,
      claimNumber: normalizeString(claim.claim_number, 'UNPARSED'),
      insuredName: normalizeString(claim.insured_name, 'Unknown'),
      lossAddress: normalizeString(claim.loss_address),
      city: normalizeString(claim.city),
      state: normalizeString(claim.state),
      carrier: normalizeString(claim.carrier, 'Unknown'),
      lossType: normalizeString(claim.loss_type, 'Unknown'),
      claimCategory: inferClaimCategory(claim),
      status: normalizeString(claim.status, 'assigned'),
      receivedAt: getReceivedAt(claim),
      slaDeadlineHours: getSlaDeadlineHours(claim),
      lossLat: claim.loss_lat,
      lossLng: claim.loss_lng,
    }))
    .sort((a, b) => {
      const aOverdue = a.slaDeadlineHours !== null && a.slaDeadlineHours < 0 ? 0 : 1;
      const bOverdue = b.slaDeadlineHours !== null && b.slaDeadlineHours < 0 ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;

      const aHours = a.slaDeadlineHours ?? Number.POSITIVE_INFINITY;
      const bHours = b.slaDeadlineHours ?? Number.POSITIVE_INFINITY;
      if (aHours !== bHours) return aHours - bHours;

      return a.receivedAt.localeCompare(b.receivedAt);
    });
}

export async function getAppointments(
  firmId: string,
  adjusterUserId: string,
  from: string,
  to: string,
): Promise<Appointment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, claim_id, firm_id, adjuster_user_id, date, arrival_time, end_time, status, notes')
    .eq('firm_id', firmId)
    .eq('adjuster_user_id', adjusterUserId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('arrival_time', { ascending: true });

  if (error || !data) {
    return [];
  }

  const appointmentRows = data as RawAppointmentRow[];
  const [claimsById, adjusterName] = await Promise.all([
    getClaimsByIds(appointmentRows.map((appointment) => appointment.claim_id)),
    getAdjusterName(firmId, adjusterUserId),
  ]);

  return appointmentRows.map((appointment) => {
    const claim = claimsById.get(appointment.claim_id);

    return {
      id: appointment.id,
      claimId: appointment.claim_id,
      firmId: appointment.firm_id,
      adjusterUserId: appointment.adjuster_user_id,
      date: appointment.date,
      arrivalTime: appointment.arrival_time.slice(0, 5),
      endTime: appointment.end_time.slice(0, 5),
      status: appointment.status,
      notes: appointment.notes,
      insuredName: normalizeString(claim?.insured_name, 'Unknown'),
      lossAddress: normalizeString(claim?.loss_address),
      city: normalizeString(claim?.city),
      state: normalizeString(claim?.state),
      lossType: normalizeString(claim?.loss_type, 'Unknown'),
      lossLat: claim?.loss_lat ?? null,
      lossLng: claim?.loss_lng ?? null,
      adjusterName,
      insured: normalizeString(claim?.insured_name, 'Unknown'),
      address: normalizeString(claim?.loss_address),
      adjuster: adjusterName,
    } satisfies Appointment;
  });
}
