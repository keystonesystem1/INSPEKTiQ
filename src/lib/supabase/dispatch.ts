import { differenceInHours } from 'date-fns';
import { DEFAULT_SLA } from '@/lib/utils/sla';
import { createClient } from '@/lib/supabase/client';
import type { DispatchAdjuster, DispatchClaim } from '@/lib/types';

interface RawClaimRow {
  id: string;
  claim_number: string | null;
  insured_name: string | null;
  loss_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
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
  claim_id: string;
  status: string | null;
  date: string | null;
  arrival_time: string | null;
}

interface RawFirmUserRow {
  id: string;
  user_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface RawAdjusterProfileRow {
  user_id: string | null;
  max_active_claims: number | null;
  approved_claim_types: string[] | null;
  approved_carriers: string[] | null;
  certifications: string[] | null;
  home_bases: unknown;
  availability: DispatchAdjuster['availability'] | null;
}

interface RawCarrierRow {
  id: string;
  name: string;
}

interface RawProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface HomeBase {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

const UNASSIGNED_STATUSES = ['received'] as const;
const DISPATCH_QUEUE_STATUSES = ['received', 'pending_acceptance'] as const;
const ASSIGNED_BASE_STATUSES = ['assigned', 'accepted', 'contacted', 'scheduled'] as const;
const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'confirmed'] as const;
const BUSINESS_NAME_PATTERN =
  /\b(llc|inc|corp|company|co\.|church|baptist|school|apartments|apartments?|hoa|condo|center|centre|restaurant|hotel|roofing|construction|properties)\b/i;

function normalizeString(value: string | null | undefined, fallback = '') {
  return value?.trim() ?? fallback;
}

function getReceivedAt(claim: RawClaimRow) {
  return claim.received_at ?? claim.created_at ?? new Date().toISOString();
}

function getSlaDeadlineHours(receivedAt: string | null, status: string | null) {
  if (!receivedAt) {
    return null;
  }

  if (status && !UNASSIGNED_STATUSES.includes(status as (typeof UNASSIGNED_STATUSES)[number])) {
    return null;
  }

  const dueAt = new Date(new Date(receivedAt).getTime() + DEFAULT_SLA.received_to_assigned * 60 * 60 * 1000);
  return differenceInHours(dueAt, new Date());
}

function inferClaimCategory(claim: RawClaimRow) {
  // TODO: claim_category not in schema — derived field, needs migration.
  const policyType = normalizeString(claim.policy_type).toLowerCase();
  const insuredName = normalizeString(claim.insured_name);
  const lossType = normalizeString(claim.loss_type).toLowerCase();

  if (policyType.includes('farm') || lossType.includes('farm')) return 'Farm/Ranch';
  if (policyType.includes('industrial') || lossType.includes('industrial')) return 'Industrial';
  if (policyType.includes('commercial') || BUSINESS_NAME_PATTERN.test(insuredName)) return 'Commercial';
  return 'Residential';
}

function inferRequiredCerts(claim: RawClaimRow, claimCategory: string) {
  const requiredCerts: string[] = [];
  const carrier = normalizeString(claim.carrier).toLowerCase();
  const policyType = normalizeString(claim.policy_type).toLowerCase();
  // TODO: requires_twia not in schema — derived field, needs migration.
  const requiresTwia = carrier.includes('twia') || policyType.includes('twia');

  if (requiresTwia) {
    requiredCerts.push('TWIA Cert');
  }

  if (claimCategory === 'Commercial' || claimCategory === 'Industrial') {
    requiredCerts.push('Commercial Lic');
  }

  return { requiresTwia, requiredCerts };
}

function mapDispatchClaim(
  claim: RawClaimRow,
  appointmentStatus: string | null,
): DispatchClaim {
  const claimCategory = inferClaimCategory(claim);
  const { requiresTwia, requiredCerts } = inferRequiredCerts(claim, claimCategory);

  return {
    id: claim.id,
    claimNumber: normalizeString(claim.claim_number, 'UNPARSED'),
    insuredName: normalizeString(claim.insured_name, 'Unknown'),
    lossAddress: normalizeString(claim.loss_address),
    city: normalizeString(claim.city),
    state: normalizeString(claim.state),
    zip: normalizeString(claim.zip),
    carrier: normalizeString(claim.carrier, 'Unknown'),
    lossType: normalizeString(claim.loss_type, 'Unknown'),
    claimCategory,
    requiresTwia,
    requiredCerts,
    status: normalizeString(claim.status, 'received'),
    appointmentStatus,
    receivedAt: getReceivedAt(claim),
    slaDeadlineHours: getSlaDeadlineHours(getReceivedAt(claim), claim.status),
    lossLat: claim.loss_lat,
    lossLng: claim.loss_lng,
  };
}

function compareAppointmentRows(a: RawAppointmentRow, b: RawAppointmentRow) {
  const aKey = `${a.date ?? ''}T${a.arrival_time ?? ''}`;
  const bKey = `${b.date ?? ''}T${b.arrival_time ?? ''}`;
  return aKey.localeCompare(bKey);
}

function getLatestAppointmentsByClaim(appointments: RawAppointmentRow[]) {
  const latestByClaim = new Map<string, RawAppointmentRow>();

  for (const appointment of appointments) {
    const current = latestByClaim.get(appointment.claim_id);
    if (!current || compareAppointmentRows(current, appointment) < 0) {
      latestByClaim.set(appointment.claim_id, appointment);
    }
  }

  return latestByClaim;
}

function composeFullName(firstName: string | null, lastName: string | null) {
  const parts = [normalizeString(firstName), normalizeString(lastName)]
    .map((value) => value.trim())
    .filter(Boolean);

  return parts.length ? parts.join(' ') : null;
}

function getDisplayName(user: RawFirmUserRow, email: string | null | undefined) {
  return (
    composeFullName(user.first_name, user.last_name) ||
    normalizeString(user.full_name) ||
    normalizeString(email) ||
    'Adjuster'
  );
}

function getInitials(
  firstName: string | null,
  lastName: string | null,
  fullName: string | null,
  email: string | null | undefined,
) {
  const normalizedFirst = normalizeString(firstName);
  const normalizedLast = normalizeString(lastName);

  if (normalizedFirst && normalizedLast) {
    return `${normalizedFirst[0] ?? ''}${normalizedLast[0] ?? ''}`.toUpperCase();
  }

  const fallbackName = normalizeString(fullName) || normalizeString(email) || 'Adjuster';
  const parts = fallbackName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function parseHomeBase(homeBases: unknown): HomeBase {
  if (!Array.isArray(homeBases) || !homeBases.length) {
    return { city: null, state: null, lat: null, lng: null };
  }

  const primary =
    homeBases.find(
      (entry) =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        'isPrimary' in (entry as Record<string, unknown>) &&
        (entry as Record<string, unknown>).isPrimary === true,
    ) ?? homeBases[0];

  const first = primary;
  if (!first || typeof first !== 'object') {
    return { city: null, state: null, lat: null, lng: null };
  }

  const record = first as Record<string, unknown>;
  return {
    city: typeof record.city === 'string' ? record.city : null,
    state: typeof record.state === 'string' ? record.state : null,
    lat: typeof record.lat === 'number' ? record.lat : null,
    lng: typeof record.lng === 'number' ? record.lng : null,
  };
}

function getLocationLabel(homeBase: HomeBase) {
  if (homeBase.city && homeBase.state) return `${homeBase.city}, ${homeBase.state}`;
  if (homeBase.city) return homeBase.city;
  if (homeBase.state) return homeBase.state;
  return 'Remote';
}

async function getCarrierNamesById(firmId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('id, name')
    .eq('firm_id', firmId);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map((data as RawCarrierRow[]).map((carrier) => [carrier.id, carrier.name]));
}

export async function getFirmCarrierNames(firmId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('name')
    .eq('firm_id', firmId)
    .order('name', { ascending: true });

  if (error || !data) {
    return [];
  }

  return Array.from(
    new Set(
      (data as Array<{ name: string | null }>)
        .map((carrier) => normalizeString(carrier.name))
        .filter(Boolean),
    ),
  );
}

async function getProfilesById(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, RawProfileRow>();
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  if (error || !data) {
    return new Map<string, RawProfileRow>();
  }

  return new Map((data as RawProfileRow[]).map((profile) => [profile.id, profile]));
}

export async function getUnassignedClaims(firmId: string): Promise<DispatchClaim[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('claims')
    .select('id, claim_number, insured_name, loss_address, city, state, zip, carrier, loss_type, policy_type, status, received_at, created_at, loss_lat, loss_lng')
    .eq('firm_id', firmId)
    .in('status', [...DISPATCH_QUEUE_STATUSES])
    .order('received_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load unassigned claims.');
  }

  if (!data) {
    throw new Error('Unable to load unassigned claims.');
  }

  return (data as RawClaimRow[]).map((claim) => mapDispatchClaim(claim, null));
}

export async function getAssignedActiveClaims(firmId: string): Promise<DispatchClaim[]> {
  const supabase = createClient();
  const [{ data: claimRows, error: claimsError }, { data: appointmentRows, error: appointmentsError }] = await Promise.all([
    supabase
      .from('claims')
      .select('id, claim_number, insured_name, loss_address, city, state, zip, carrier, loss_type, policy_type, status, received_at, created_at, loss_lat, loss_lng')
      .eq('firm_id', firmId)
      .in('status', [...ASSIGNED_BASE_STATUSES]),
    supabase
      .from('appointments')
      .select('claim_id, status, date, arrival_time')
      .eq('firm_id', firmId)
      .in('status', [...ACTIVE_APPOINTMENT_STATUSES]),
  ]);

  if (claimsError || appointmentsError || !claimRows) {
    return [];
  }

  const latestAppointmentByClaim = getLatestAppointmentsByClaim((appointmentRows ?? []) as RawAppointmentRow[]);

  return (claimRows as RawClaimRow[])
    .filter((claim) => {
      const appointment = latestAppointmentByClaim.get(claim.id);
      if (appointment) {
        return true;
      }

      return claim.status === 'assigned' || claim.status === 'accepted' || claim.status === 'contacted';
    })
    .map((claim) => mapDispatchClaim(claim, latestAppointmentByClaim.get(claim.id)?.status ?? null));
}

export async function getAdjustersForDispatch(firmId: string): Promise<DispatchAdjuster[]> {
  const supabase = createClient();
  const [{ data: firmUsers, error: firmUsersError }, { data: profileRows, error: profilesError }, carrierNamesById] = await Promise.all([
    supabase
      .from('firm_users')
      .select('id, user_id, full_name, first_name, last_name')
      .eq('firm_id', firmId)
      .eq('role', 'adjuster')
      .eq('is_active', true),
    supabase
      .from('adjuster_profiles')
      .select('user_id, max_active_claims, approved_claim_types, approved_carriers, certifications, home_bases, availability')
      .eq('firm_id', firmId),
    getCarrierNamesById(firmId),
  ]);

  if (firmUsersError || profilesError || !firmUsers) {
    return [];
  }

  const typedFirmUsers = firmUsers as RawFirmUserRow[];
  const typedProfiles = (profileRows ?? []) as RawAdjusterProfileRow[];
  const claimsByAdjuster = new Map<string, number>();

  const { data: claimRows, error: claimsError } = await supabase
    .from('claims')
    .select('assigned_user_id, status')
    .eq('firm_id', firmId)
    .in('status', ['assigned', 'accepted', 'contacted', 'scheduled', 'needs_attention']);

  if (!claimsError && claimRows) {
    for (const row of claimRows as Array<{ assigned_user_id: string | null }>) {
      if (!row.assigned_user_id) continue;
      claimsByAdjuster.set(row.assigned_user_id, (claimsByAdjuster.get(row.assigned_user_id) ?? 0) + 1);
    }
  }

  const publicProfilesById = await getProfilesById(
    typedFirmUsers
      .map((user) => user.user_id)
      .filter((value): value is string => Boolean(value)),
  );
  const adjusterProfilesByFirmUserId = new Map(
    typedProfiles
      .filter((profile): profile is RawAdjusterProfileRow & { user_id: string } => Boolean(profile.user_id))
      .map((profile) => [profile.user_id, profile]),
  );

  return typedFirmUsers
    .filter((user): user is RawFirmUserRow & { user_id: string } => Boolean(user.user_id))
    .map((user) => {
      const adjusterProfile = adjusterProfilesByFirmUserId.get(user.user_id);
      const publicProfile = publicProfilesById.get(user.user_id);
      const name = getDisplayName(user, publicProfile?.email);
      const homeBase = parseHomeBase(adjusterProfile?.home_bases);
      const maxClaims = adjusterProfile?.max_active_claims ?? 10;
      const activeClaims = claimsByAdjuster.get(user.user_id) ?? 0;

      return {
        id: user.user_id,
        name,
        initials: getInitials(user.first_name, user.last_name, user.full_name, publicProfile?.email),
        location: getLocationLabel(homeBase),
        activeClaims,
        maxClaims,
        availability: adjusterProfile?.availability ?? 'remote',
        approvedCarriers: (adjusterProfile?.approved_carriers ?? []).map((carrierId) => carrierNamesById.get(carrierId) ?? carrierId),
        approvedClaimTypes: adjusterProfile?.approved_claim_types ?? [],
        certifications: adjusterProfile?.certifications ?? [],
        homeLat: homeBase.lat,
        homeLng: homeBase.lng,
      } satisfies DispatchAdjuster;
    });
}
