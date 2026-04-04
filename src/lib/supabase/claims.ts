import { createClient } from '@/lib/supabase/server';
import type { Claim, ClaimStatus } from '@/lib/types';

interface RawClaim {
  id: string;
  claim_number: string | null;
  insured_name: string | null;
  carrier: string | null;
  loss_type: string | null;
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
  created_at: string | null;
}

function mapClaimRow(raw: RawClaim): Claim {
  const createdAt = raw.created_at ? new Date(raw.created_at) : new Date();
  const slaDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const slaHoursRemaining = Math.round((slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60));

  return {
    id: raw.id,
    number: raw.claim_number ?? 'UNPARSED',
    insured: raw.insured_name ?? 'Unknown',
    client: raw.carrier ?? 'Unknown',
    type: raw.loss_type ?? 'Unknown',
    category: 'Residential',
    dateOfLoss: raw.date_of_loss ?? '',
    dueDate: slaDeadline.toISOString().split('T')[0],
    status: (raw.status as ClaimStatus) ?? 'received',
    adjuster: undefined,
    carrier: raw.carrier ?? undefined,
    city: raw.city ?? '',
    state: raw.state ?? '',
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

export async function getClaims(firmId: string): Promise<Claim[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('claims')
    .select(
      'id, claim_number, insured_name, carrier, loss_type, date_of_loss, status, city, state, loss_address, policy_number, loss_description, assigned_user_id, loss_lat, loss_lng, created_at',
    )
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });
  if (error) console.error('getClaims error:', error);
  return ((data ?? []) as RawClaim[]).map(mapClaimRow);
}
