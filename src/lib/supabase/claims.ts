import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserEmailsById } from '@/lib/supabase/adjusters';
import type { Claim, ClaimContactEntry, ClaimContactsData, ClaimStatus, Role } from '@/lib/types';

interface RawClaim {
  id: string;
  claim_number: string | null;
  is_archived?: boolean | null;
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
    isArchived: raw.is_archived ?? false,
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

async function getCarrierNameForUser(firmId: string, userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: firmUser } = await supabase
    .from('firm_users')
    .select('carrier_id')
    .eq('firm_id', firmId)
    .eq('user_id', userId)
    .maybeSingle<{ carrier_id: string | null }>();
  if (!firmUser?.carrier_id) return null;
  const { data: carrier } = await supabase
    .from('carriers')
    .select('name')
    .eq('id', firmUser.carrier_id)
    .maybeSingle<{ name: string }>();
  return carrier?.name ?? null;
}

export async function getClaims(
  firmId: string,
  role: Role,
  userId: string,
  options?: { archived?: boolean },
): Promise<Claim[]> {
  const supabase = await createClient();
  const archived = options?.archived ?? false;
  let query = supabase
    .from('claims')
    .select(
      'id, claim_number, is_archived, insured_name, insured_phone, insured_email, zip, carrier, loss_type, policy_type, date_of_loss, status, city, state, loss_address, policy_number, loss_description, assigned_user_id, loss_lat, loss_lng, created_at',
    )
    .eq('firm_id', firmId)
    .eq('is_archived', archived)
    .order('created_at', { ascending: false });

  if (role === 'adjuster' || role === 'carrier_desk_adjuster') {
    query = query.eq('assigned_user_id', userId);
  } else if (role === 'carrier_admin') {
    const carrierName = await getCarrierNameForUser(firmId, userId);
    if (!carrierName) return [];
    // TODO: claims.carrier is a text column — fragile name match. Phase 5: add claims.carrier_id FK.
    query = query.eq('carrier', carrierName);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getClaims error: ${error.message}`);
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
      'id, claim_number, is_archived, insured_name, insured_phone, insured_email, zip, carrier, loss_type, policy_type, date_of_loss, status, city, state, loss_address, policy_number, loss_description, assigned_user_id, loss_lat, loss_lng, examiner_name, created_at',
    )
    .eq('id', id)
    .eq('firm_id', firmId)
    .eq('is_archived', false);

  if (role === 'adjuster' || role === 'carrier_desk_adjuster') {
    query = query.eq('assigned_user_id', userId);
  } else if (role === 'carrier_admin') {
    const carrierName = await getCarrierNameForUser(firmId, userId);
    if (!carrierName) return null;
    query = query.eq('carrier', carrierName);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;
  const claim = data as RawClaim;
  const usersById = await getUserEmailsById(
    claim.assigned_user_id ? [claim.assigned_user_id] : [],
  );
  return mapClaimRow(claim, claim.assigned_user_id ? usersById.get(claim.assigned_user_id) : undefined);
}

export async function getClaimContactsData(claimId: string, firmId: string): Promise<ClaimContactsData> {
  const admin = createAdminClient();
  const { data: claimRow } = await admin
    .from('claims')
    .select('assigned_user_id, carrier_id, insured_name, insured_phone, insured_email, examiner_name, claim_contacts')
    .eq('id', claimId)
    .eq('firm_id', firmId)
    .maybeSingle<{
      assigned_user_id: string | null;
      carrier_id: string | null;
      insured_name: string | null;
      insured_phone: string | null;
      insured_email: string | null;
      examiner_name: string | null;
      claim_contacts: ClaimContactEntry[] | null;
    }>();

  const insured = {
    name: claimRow?.insured_name ?? '',
    phone: claimRow?.insured_phone ?? '',
    email: claimRow?.insured_email ?? '',
  };

  const editableContacts = Array.isArray(claimRow?.claim_contacts) ? claimRow!.claim_contacts : [];

  let adjuster: ClaimContactsData['adjuster'] = null;
  if (claimRow?.assigned_user_id) {
    const { data: firmUser } = await admin
      .from('firm_users')
      .select('full_name, first_name, last_name')
      .eq('firm_id', firmId)
      .eq('user_id', claimRow.assigned_user_id)
      .maybeSingle<{ full_name: string | null; first_name: string | null; last_name: string | null }>();
    const emails = await getUserEmailsById([claimRow.assigned_user_id]);
    const name =
      [firmUser?.first_name, firmUser?.last_name].filter(Boolean).join(' ').trim() ||
      firmUser?.full_name?.trim() ||
      emails.get(claimRow.assigned_user_id) ||
      'Adjuster';
    adjuster = {
      name,
      email: emails.get(claimRow.assigned_user_id) ?? '',
      phone: null,
    };
  }

  const examiner: ClaimContactsData['examiner'] = claimRow?.examiner_name
    ? { name: claimRow.examiner_name, email: null }
    : null;

  let carrierDeskAdjusters: ClaimContactsData['carrierDeskAdjusters'] = [];
  if (claimRow?.carrier_id) {
    const { data: deskRows } = await admin
      .from('firm_users')
      .select('id, user_id, full_name, first_name, last_name')
      .eq('firm_id', firmId)
      .eq('carrier_id', claimRow.carrier_id)
      .eq('role', 'carrier_desk_adjuster');
    const rows = (deskRows ?? []) as Array<{
      id: string;
      user_id: string | null;
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
    }>;
    const userIds = rows.map((row) => row.user_id).filter((value): value is string => Boolean(value));
    const emails = await getUserEmailsById(userIds);
    carrierDeskAdjusters = rows.map((row) => ({
      firmUserId: row.id,
      name:
        [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
        row.full_name?.trim() ||
        (row.user_id ? emails.get(row.user_id) ?? '' : '') ||
        'Desk Adjuster',
      email: row.user_id ? emails.get(row.user_id) ?? '' : '',
    }));
  }

  return { adjuster, examiner, carrierDeskAdjusters, insured, editableContacts };
}
