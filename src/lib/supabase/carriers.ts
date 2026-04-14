import { createAdminClient } from '@/lib/supabase/admin';
import { getUserEmailsById } from '@/lib/supabase/adjusters';
import type { CarrierCreate, CarrierPortalUser, CarrierRow } from '@/lib/types';

interface RawCarrierRow {
  id: string;
  firm_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  billing_preference: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip: string | null;
  portal_enabled: boolean | null;
  invite_status: string | null;
  logo_url: string | null;
  notes: string | null;
  guidelines_url: string | null;
  guidelines_notes: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface RawCarrierClaimRow {
  carrier: string | null;
  status: string | null;
}

interface RawCarrierFirmUserRow {
  id: string;
  user_id: string | null;
  carrier_id: string | null;
  role: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  invited_at: string | null;
  joined_at: string | null;
}

const CARRIER_COLUMNS =
  'id, firm_id, name, contact_name, contact_email, phone, address, city, state, zip, billing_preference, billing_contact_name, billing_contact_email, billing_address, billing_city, billing_state, billing_zip, portal_enabled, invite_status, logo_url, notes, guidelines_url, guidelines_notes, is_active, created_at';

const ACTIVE_CLAIM_STATUSES = new Set([
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
  'pending_te',
  'on_hold',
]);

function normalizeBillingPreference(value: string | null): 'desk_adjuster' | 'billing_contact' {
  return value === 'billing_contact' ? 'billing_contact' : 'desk_adjuster';
}

function normalizeInviteStatus(value: string | null): 'not_invited' | 'pending' | 'accepted' {
  if (value === 'pending') return 'pending';
  if (value === 'accepted') return 'accepted';
  return 'not_invited';
}

function composeName(first: string | null, last: string | null, full: string | null): string | null {
  const parts = [first?.trim(), last?.trim()].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return full?.trim() || null;
}

function mapCarrier(
  raw: RawCarrierRow,
  activeClaims: number,
  totalClaims: number,
  portalUsers: CarrierPortalUser[],
): CarrierRow {
  return {
    id: raw.id,
    firmId: raw.firm_id,
    name: raw.name,
    contactName: raw.contact_name,
    contactEmail: raw.contact_email,
    phone: raw.phone,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    billingPreference: normalizeBillingPreference(raw.billing_preference),
    billingContactName: raw.billing_contact_name,
    billingContactEmail: raw.billing_contact_email,
    billingAddress: raw.billing_address,
    billingCity: raw.billing_city,
    billingState: raw.billing_state,
    billingZip: raw.billing_zip,
    portalEnabled: raw.portal_enabled ?? false,
    inviteStatus: normalizeInviteStatus(raw.invite_status),
    logoUrl: raw.logo_url,
    notes: raw.notes,
    guidelinesUrl: raw.guidelines_url,
    guidelinesNotes: raw.guidelines_notes,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at ?? '',
    activeClaims,
    totalClaims,
    portalUsers,
  };
}

async function getPortalUsersByCarrierId(firmId: string, carrierIds: string[]): Promise<Map<string, CarrierPortalUser[]>> {
  if (!carrierIds.length) return new Map();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('firm_users')
    .select('id, user_id, carrier_id, role, full_name, first_name, last_name, invited_at, joined_at')
    .eq('firm_id', firmId)
    .in('carrier_id', carrierIds)
    .in('role', ['carrier_admin', 'carrier_desk_adjuster']);

  if (error) {
    throw new Error(`getPortalUsersByCarrierId error: ${error.message}`);
  }

  const rows = (data ?? []) as RawCarrierFirmUserRow[];
  const userIds = rows.map((row) => row.user_id).filter((value): value is string => Boolean(value));
  const emailsByUserId = await getUserEmailsById(userIds);

  const byCarrier = new Map<string, CarrierPortalUser[]>();
  for (const row of rows) {
    if (!row.carrier_id || !row.user_id) continue;
    const list = byCarrier.get(row.carrier_id) ?? [];
    list.push({
      userId: row.user_id,
      firmUserId: row.id,
      name: composeName(row.first_name, row.last_name, row.full_name),
      email: emailsByUserId.get(row.user_id) ?? '',
      role: row.role === 'carrier_desk_adjuster' ? 'carrier_desk_adjuster' : 'carrier_admin',
      inviteStatus: row.joined_at ? 'accepted' : 'pending',
    });
    byCarrier.set(row.carrier_id, list);
  }
  return byCarrier;
}

async function getClaimCountsByCarrierName(firmId: string): Promise<Map<string, { active: number; total: number }>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claims')
    .select('carrier, status')
    .eq('firm_id', firmId)
    .eq('is_archived', false);

  if (error) {
    throw new Error(`getClaimCountsByCarrierName error: ${error.message}`);
  }

  const map = new Map<string, { active: number; total: number }>();
  for (const row of (data ?? []) as RawCarrierClaimRow[]) {
    const name = row.carrier?.trim();
    if (!name) continue;
    const entry = map.get(name) ?? { active: 0, total: 0 };
    entry.total += 1;
    if (row.status && ACTIVE_CLAIM_STATUSES.has(row.status)) {
      entry.active += 1;
    }
    map.set(name, entry);
  }
  return map;
}

export async function getCarriers(firmId: string): Promise<CarrierRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('carriers')
    .select(CARRIER_COLUMNS)
    .eq('firm_id', firmId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`getCarriers error: ${error.message}`);
  }

  const rows = (data ?? []) as RawCarrierRow[];
  const [claimCounts, portalUsersByCarrier] = await Promise.all([
    getClaimCountsByCarrierName(firmId),
    getPortalUsersByCarrierId(firmId, rows.map((row) => row.id)),
  ]);

  return rows.map((row) => {
    const counts = claimCounts.get(row.name) ?? { active: 0, total: 0 };
    return mapCarrier(row, counts.active, counts.total, portalUsersByCarrier.get(row.id) ?? []);
  });
}

export async function getCarrierById(firmId: string, carrierId: string): Promise<CarrierRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('carriers')
    .select(CARRIER_COLUMNS)
    .eq('firm_id', firmId)
    .eq('id', carrierId)
    .maybeSingle<RawCarrierRow>();

  if (error) {
    throw new Error(`getCarrierById error: ${error.message}`);
  }
  if (!data) return null;

  const [claimCounts, portalUsersByCarrier] = await Promise.all([
    getClaimCountsByCarrierName(firmId),
    getPortalUsersByCarrierId(firmId, [data.id]),
  ]);
  const counts = claimCounts.get(data.name) ?? { active: 0, total: 0 };
  return mapCarrier(data, counts.active, counts.total, portalUsersByCarrier.get(data.id) ?? []);
}

export async function createCarrier(firmId: string, input: CarrierCreate): Promise<CarrierRow> {
  const supabase = createAdminClient();
  const insertPayload = {
    firm_id: firmId,
    name: input.name,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    phone: input.phone ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zip: input.zip ?? null,
    billing_preference: input.billingPreference,
    billing_contact_name: input.billingContactName ?? null,
    billing_contact_email: input.billingContactEmail ?? null,
    billing_address: input.billingAddress ?? null,
    billing_city: input.billingCity ?? null,
    billing_state: input.billingState ?? null,
    billing_zip: input.billingZip ?? null,
    notes: input.notes ?? null,
    guidelines_url: input.guidelinesUrl ?? null,
    guidelines_notes: input.guidelinesNotes ?? null,
    portal_enabled: false,
    invite_status: 'not_invited',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('carriers')
    .insert(insertPayload)
    .select(CARRIER_COLUMNS)
    .single<RawCarrierRow>();

  if (error || !data) {
    throw new Error(`createCarrier error: ${error?.message ?? 'unknown'}`);
  }

  return mapCarrier(data, 0, 0, []);
}

export interface CarrierForUser {
  id: string;
  firmId: string;
  name: string;
  intakeEmail: string | null;
}

export async function getCarrierForFirmUser(userId: string): Promise<CarrierForUser | null> {
  const supabase = createAdminClient();
  const { data: firmUser } = await supabase
    .from('firm_users')
    .select('firm_id, carrier_id')
    .eq('user_id', userId)
    .maybeSingle<{ firm_id: string; carrier_id: string | null }>();
  if (!firmUser?.carrier_id) return null;
  const { data: carrier } = await supabase
    .from('carriers')
    .select('id, firm_id, name, intake_email')
    .eq('id', firmUser.carrier_id)
    .maybeSingle<{ id: string; firm_id: string; name: string; intake_email: string | null }>();
  if (!carrier) return null;
  return {
    id: carrier.id,
    firmId: carrier.firm_id,
    name: carrier.name,
    intakeEmail: carrier.intake_email,
  };
}

export async function updateCarrier(
  firmId: string,
  carrierId: string,
  input: Partial<CarrierCreate> & { isActive?: boolean; portalEnabled?: boolean; inviteStatus?: 'not_invited' | 'pending' | 'accepted' },
): Promise<void> {
  const supabase = createAdminClient();
  const updatePayload: Record<string, unknown> = {};
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.contactName !== undefined) updatePayload.contact_name = input.contactName;
  if (input.contactEmail !== undefined) updatePayload.contact_email = input.contactEmail;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.address !== undefined) updatePayload.address = input.address;
  if (input.city !== undefined) updatePayload.city = input.city;
  if (input.state !== undefined) updatePayload.state = input.state;
  if (input.zip !== undefined) updatePayload.zip = input.zip;
  if (input.billingPreference !== undefined) updatePayload.billing_preference = input.billingPreference;
  if (input.billingContactName !== undefined) updatePayload.billing_contact_name = input.billingContactName;
  if (input.billingContactEmail !== undefined) updatePayload.billing_contact_email = input.billingContactEmail;
  if (input.billingAddress !== undefined) updatePayload.billing_address = input.billingAddress;
  if (input.billingCity !== undefined) updatePayload.billing_city = input.billingCity;
  if (input.billingState !== undefined) updatePayload.billing_state = input.billingState;
  if (input.billingZip !== undefined) updatePayload.billing_zip = input.billingZip;
  if (input.notes !== undefined) updatePayload.notes = input.notes;
  if (input.guidelinesUrl !== undefined) updatePayload.guidelines_url = input.guidelinesUrl;
  if (input.guidelinesNotes !== undefined) updatePayload.guidelines_notes = input.guidelinesNotes;
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive;
  if (input.portalEnabled !== undefined) updatePayload.portal_enabled = input.portalEnabled;
  if (input.inviteStatus !== undefined) updatePayload.invite_status = input.inviteStatus;

  const { error } = await supabase
    .from('carriers')
    .update(updatePayload)
    .eq('firm_id', firmId)
    .eq('id', carrierId);

  if (error) {
    throw new Error(`updateCarrier error: ${error.message}`);
  }
}
