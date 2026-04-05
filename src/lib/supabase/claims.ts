import { createClient } from '@/lib/supabase/server';
import { getUserEmailsById } from '@/lib/supabase/adjusters';
import type { Claim, ClaimStatus, Role } from '@/lib/types';

interface RawClaim {
  id: string;
  claim_number: string | null;
  insured_name: string | null;
  insured_phone?: string | null;
  insured_email?: string | null;
  zip?: string | null;
  carrier: string | null;
  loss_type: string | null;
  policy_type?: string | null;
  date_of_loss: string | null;
  status: string | null;
  city: string | null;
  state: string | null;
  loss_address: string | null;
  policy_number: string | null;
  loss_description: string | null;
  assigned_user_id: string | null;
  loss_lat: number | null;
  loss_lng: number | null;
  examiner_name?: string | null;
  created_at: string | null;
}

function mapClaimRow(raw: RawClaim, adjusterEmail?: string): Claim {
  const createdAt = raw.created_at ? new Date(raw.created_at) : new Date();
  const slaDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const slaHoursRemaining = Math.round((slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60));

  return {
    id: raw.id,
    number: raw.claim_number ?? 'UNPARSED',
    insured: raw.insured_name ?? 'Unknown',
    insuredPhone: raw.insured_phone ?? '',
    insuredEmail: raw.insured_email ?? '',
    client: raw.carrier ?? 'Unknown',
    type: raw.loss_type ?? 'Unknown',
    category: raw.policy_type ?? 'Residential',
    dateOfLoss: raw.date_of_loss ?? '',
    dueDate: slaDeadline.toISOString().split('T')[0],
    status: (raw.status as ClaimStatus) ?? 'received',
    adjuster: adjusterEmail ?? undefined,
    examiner: raw.examiner_name ?? undefined,
    carrier: raw.carrier ?? undefined,
    city: raw.city ?? '',
    state: raw.state ?? '',
    zip: raw.zip ?? '',
    address: raw.loss_address ?? '',
    slaHoursRemaining,
    policyNumber: raw.policy_number ?? '',
    lossCause: raw.loss_description ?? '',
    notesCount: 0,
    photosCount: 0,
    reserveTotal: 0,
    lat: raw.loss_lat ?? 0,
    lng: raw.loss_lng ?? 0,
    milestones: {},
  };
}

export async function getClaims(
  firmId: string,
  role: Role,
  userId: string,
): Promise<Claim[]> {
  const supabase = await createClient();
  let query = supabase
    .from('claims')
    .select(
      'id, claim_number, insured_name, insured_phone, insured_email, zip, carrier, loss_type, policy_type, date_of_loss, status, city, state, loss_address, policy_number, loss_description, assigned_user_id, loss_lat, loss_lng, created_at',
    )
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (role === 'adjuster') {
    query = query.eq('assigned_user_id', userId);
  }

  const { data, error } = await query;
  if (error) console.error('getClaims error:', error);
  const claims = (data ?? []) as RawClaim[];
  const usersById = await getUserEmailsById(
    claims
      .map((claim) => claim.assigned_user_id)
      .filter((value): value is string => Boolean(value)),
  );
  return claims.map((claim) => mapClaimRow(claim, claim.assigned_user_id ? usersById.get(claim.assigned_user_id) : undefined));
}

export async function getClaimById(
  id: string,
  firmId: string,
  role: Role,
  userId: string,
): Promise<Claim | null> {
  const supabase = await createClient();
  // INSPEKTiT writes directly to the shared claims.status column in Supabase.
  // INSPEKTiQ reads that column fresh on each page load through getClaimById/getClaims,
  // so status changes made in INSPEKTiT flow through automatically without extra sync code.
  let query = supabase
    .from('claims')
    .select(
      'id, claim_number, insured_name, insured_phone, insured_email, zip, carrier, loss_type, policy_type, date_of_loss, status, city, state, loss_address, policy_number, loss_description, assigned_user_id, loss_lat, loss_lng, examiner_name, created_at',
    )
    .eq('id', id)
    .eq('firm_id', firmId);

  if (role === 'adjuster') {
    query = query.eq('assigned_user_id', userId);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;
  const claim = data as RawClaim;
  const usersById = await getUserEmailsById(
    claim.assigned_user_id ? [claim.assigned_user_id] : [],
  );
  return mapClaimRow(claim, claim.assigned_user_id ? usersById.get(claim.assigned_user_id) : undefined);
}
