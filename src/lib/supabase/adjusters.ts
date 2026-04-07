import { createAdminClient } from '@/lib/supabase/admin';
import type { DispatchAdjuster } from '@/lib/types';

export interface AdjusterOption {
  id: string;
  userId: string;
  email: string;
}

interface RawDispatchFirmUserRow {
  id: string;
  user_id: string | null;
  full_name: string | null;
}

interface RawDispatchAdjusterProfileRow {
  user_id: string | null;
  max_active_claims: number | null;
  approved_claim_types: string[] | null;
  approved_carriers: string[] | null;
  certifications: string[] | null;
  home_bases: unknown;
}

interface RawCarrierRow {
  id: string;
  name: string;
}

interface HomeBase {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

function normalizeString(value: string | null | undefined, fallback = '') {
  return value?.trim() ?? fallback;
}

function getInitials(name: string) {
  const parts = name
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

  const first = homeBases[0];
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

function getAvailability(activeClaims: number, maxClaims: number, homeBase: HomeBase): DispatchAdjuster['availability'] {
  if (activeClaims >= maxClaims) return 'busy';
  if (!homeBase.lat || !homeBase.lng) return 'remote';
  return 'available';
}

async function getUserEmailsById(userIds: string[]): Promise<Map<string, string>> {
  if (!userIds.length) {
    return new Map();
  }

  const adminSupabase = createAdminClient();
  const {
    data: { users },
    error: usersError,
  } = await adminSupabase.auth.admin.listUsers();

  if (usersError) {
    return new Map();
  }

  const userIdSet = new Set(userIds);
  const matchedUsers = users.filter((user) => userIdSet.has(user.id));

  return new Map(
    matchedUsers.map((user) => [user.id, user.email ?? '']),
  );
}

export async function getAdjusters(firmId: string): Promise<AdjusterOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('firm_users')
    .select('id, user_id')
    .eq('firm_id', firmId)
    .eq('role', 'adjuster')
    .eq('is_active', true);

  if (error || !data?.length) {
    return [];
  }

  const userIds = data
    .map((row) => row.user_id)
    .filter((value): value is string => Boolean(value));

  if (!userIds.length) {
    return [];
  }

  const usersById = await getUserEmailsById(userIds);
  return data
    .map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      email: usersById.get(row.user_id as string) ?? '',
    }))
    .filter((row) => row.email);
}

export async function getAdjustersForDispatchAdmin(firmId: string): Promise<DispatchAdjuster[]> {
  const supabase = createAdminClient();
  const [{ data: firmUsers, error: firmUsersError }, { data: profileRows, error: profilesError }, { data: carrierRows, error: carriersError }] = await Promise.all([
    supabase
      .from('firm_users')
      .select('id, user_id, full_name')
      .eq('firm_id', firmId)
      .eq('role', 'adjuster')
      .eq('is_active', true),
    supabase
      .from('adjuster_profiles')
      .select('user_id, max_active_claims, approved_claim_types, approved_carriers, certifications, home_bases')
      .eq('firm_id', firmId),
    supabase
      .from('carriers')
      .select('id, name')
      .eq('firm_id', firmId),
  ]);

  if (firmUsersError || profilesError || carriersError || !firmUsers) {
    throw new Error(firmUsersError?.message || profilesError?.message || carriersError?.message || 'Unable to load adjusters.');
  }

  const { data: claimRows, error: claimsError } = await supabase
    .from('claims')
    .select('assigned_user_id, status')
    .eq('firm_id', firmId)
    .in('status', ['assigned', 'accepted', 'contacted', 'scheduled', 'needs_attention']);

  if (claimsError) {
    throw new Error(claimsError.message || 'Unable to load adjuster claims.');
  }

  const typedFirmUsers = firmUsers as RawDispatchFirmUserRow[];
  const typedProfiles = (profileRows ?? []) as RawDispatchAdjusterProfileRow[];
  const carrierNamesById = new Map(
    ((carrierRows ?? []) as RawCarrierRow[]).map((carrier) => [carrier.id, carrier.name]),
  );
  const claimsByAdjuster = new Map<string, number>();

  for (const row of (claimRows ?? []) as Array<{ assigned_user_id: string | null }>) {
    if (!row.assigned_user_id) continue;
    claimsByAdjuster.set(row.assigned_user_id, (claimsByAdjuster.get(row.assigned_user_id) ?? 0) + 1);
  }

  const userIds = typedFirmUsers
    .map((user) => user.user_id)
    .filter((value): value is string => Boolean(value));
  const usersById = await getUserEmailsById(userIds);
  const adjusterProfilesByUserId = new Map(
    typedProfiles
      .filter((profile): profile is RawDispatchAdjusterProfileRow & { user_id: string } => Boolean(profile.user_id))
      .map((profile) => [profile.user_id, profile]),
  );

  return typedFirmUsers
    .filter((user): user is RawDispatchFirmUserRow & { user_id: string } => Boolean(user.user_id))
    .map((user) => {
      const adjusterProfile = adjusterProfilesByUserId.get(user.user_id);
      const name =
        normalizeString(user.full_name) ||
        normalizeString(usersById.get(user.user_id)) ||
        'Adjuster';
      const homeBase = parseHomeBase(adjusterProfile?.home_bases);
      const maxClaims = adjusterProfile?.max_active_claims ?? 10;
      const activeClaims = claimsByAdjuster.get(user.user_id) ?? 0;

      return {
        id: user.user_id,
        name,
        initials: getInitials(name),
        location: getLocationLabel(homeBase),
        activeClaims,
        maxClaims,
        availability: getAvailability(activeClaims, maxClaims, homeBase),
        approvedCarriers: (adjusterProfile?.approved_carriers ?? []).map((carrierId) => carrierNamesById.get(carrierId) ?? carrierId),
        approvedClaimTypes: adjusterProfile?.approved_claim_types ?? [],
        certifications: adjusterProfile?.certifications ?? [],
        homeLat: homeBase.lat,
        homeLng: homeBase.lng,
      } satisfies DispatchAdjuster;
    });
}

export { getUserEmailsById };
