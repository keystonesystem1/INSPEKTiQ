import { createAdminClient } from '@/lib/supabase/admin';
import type {
  AdjusterHomeBase,
  AdjusterProfileUpdate,
  AdjusterRow,
  AdjusterUserUpdate,
  DispatchAdjuster,
} from '@/lib/types';

export interface AdjusterOption {
  id: string;
  userId: string;
  email: string;
}

export interface CarrierOption {
  id: string;
  name: string;
}

export interface AdminAdjusterProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  status: 'Active' | 'Inactive';
  availability: DispatchAdjuster['availability'];
  location: string;
  activeClaims: number;
  maxClaims: number;
  certifications: string[];
  approvedClaimTypes: string[];
  approvedCarrierIds: string[];
  approvedCarriers: string[];
  homeBaseCity: string;
  homeBaseState: string;
  homeBaseZip: string;
  homeLat: number | null;
  homeLng: number | null;
  profileConfigured: boolean;
}

interface RawFirmUserRow {
  id: string;
  firm_id: string;
  user_id: string | null;
  role: string;
  is_active: boolean | null;
  invited_at: string | null;
  joined_at: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface RawAdjusterProfileRow {
  id: string;
  firm_id: string;
  user_id: string | null;
  max_active_claims: number | null;
  approved_claim_types: string[] | null;
  approved_carriers: string[] | null;
  certifications: string[] | null;
  home_bases: unknown;
  availability: DispatchAdjuster['availability'] | null;
  created_at: string | null;
  updated_at: string | null;
}

interface RawCarrierRow {
  id: string;
  name: string;
}

interface RawClaimAssignmentRow {
  assigned_user_id: string | null;
  status: string | null;
}

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function composeFullName(firstName: string | null, lastName: string | null) {
  const parts = [normalizeString(firstName), normalizeString(lastName)].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

function getDisplayName(firstName: string | null, lastName: string | null, fullName: string | null, email: string) {
  return composeFullName(firstName, lastName) ?? normalizeString(fullName) ?? email;
}

function getInitials(firstName: string | null, lastName: string | null, fullName: string | null, email: string) {
  const normalizedFirst = normalizeString(firstName);
  const normalizedLast = normalizeString(lastName);

  if (normalizedFirst && normalizedLast) {
    return `${normalizedFirst[0]}${normalizedLast[0]}`.toUpperCase();
  }

  const fallbackName = normalizeString(fullName) ?? email;
  const parts = fallbackName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function parseHomeBases(homeBases: unknown): AdjusterHomeBase[] {
  if (!Array.isArray(homeBases)) {
    return [];
  }

  return homeBases
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry, index) => ({
      name: typeof entry.name === 'string' ? entry.name : typeof entry.label === 'string' ? entry.label : `Home Base ${index + 1}`,
      city: typeof entry.city === 'string' ? entry.city : '',
      state: typeof entry.state === 'string' ? entry.state : '',
      zip: typeof entry.zip === 'string' ? entry.zip : '',
      lat: typeof entry.lat === 'number' ? entry.lat : null,
      lng: typeof entry.lng === 'number' ? entry.lng : null,
      isPrimary: typeof entry.isPrimary === 'boolean' ? entry.isPrimary : index === 0,
    }));
}

function getPrimaryHomeBase(homeBases: AdjusterHomeBase[]) {
  return homeBases.find((homeBase) => homeBase.isPrimary) ?? homeBases[0] ?? null;
}

function getLocationLabel(homeBases: AdjusterHomeBase[]) {
  const primaryHomeBase = getPrimaryHomeBase(homeBases);
  if (!primaryHomeBase) return 'Remote';
  if (primaryHomeBase.city && primaryHomeBase.state) return `${primaryHomeBase.city}, ${primaryHomeBase.state}`;
  if (primaryHomeBase.city) return primaryHomeBase.city;
  if (primaryHomeBase.state) return primaryHomeBase.state;
  return primaryHomeBase.name || 'Remote';
}

function hasConfiguredName(firstName: string | null, lastName: string | null, fullName: string | null) {
  return Boolean(composeFullName(firstName, lastName) ?? normalizeString(fullName));
}

function isProfileComplete(row: {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  certifications: string[];
  approvedClaimTypes: string[];
  approvedCarriers: string[];
  homeBases: AdjusterHomeBase[];
}) {
  return Boolean(
    hasConfiguredName(row.firstName, row.lastName, row.fullName) &&
      row.certifications.length > 0 &&
      row.approvedClaimTypes.length > 0 &&
      row.approvedCarriers.length > 0 &&
      row.homeBases.length > 0,
  );
}

async function getUserEmailsById(userIds: string[]): Promise<Map<string, string>> {
  if (!userIds.length) {
    return new Map();
  }

  const supabase = createAdminClient();
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) {
    return new Map();
  }

  const userIdSet = new Set(userIds);
  return new Map(
    users
      .filter((user) => userIdSet.has(user.id))
      .map((user) => [user.id, user.email ?? '']),
  );
}

async function getCarrierMapByFirmId(firmId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('id, name')
    .eq('firm_id', firmId)
    .order('name', { ascending: true });

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map((data as RawCarrierRow[]).map((carrier) => [carrier.id, carrier.name]));
}

async function getAdjusterData(firmId: string) {
  const supabase = createAdminClient();
  const [{ data: firmUsers, error: firmUsersError }, { data: profileRows, error: profileRowsError }, { data: claimRows, error: claimRowsError }, carrierMap] =
    await Promise.all([
      supabase
        .from('firm_users')
        .select('id, firm_id, user_id, role, is_active, invited_at, joined_at, full_name, first_name, last_name')
        .eq('firm_id', firmId)
        .eq('role', 'adjuster')
        .order('invited_at', { ascending: true }),
      supabase
        .from('adjuster_profiles')
        .select('id, firm_id, user_id, max_active_claims, approved_claim_types, approved_carriers, certifications, home_bases, availability, created_at, updated_at')
        .eq('firm_id', firmId),
      supabase
        .from('claims')
        .select('assigned_user_id, status')
        .eq('firm_id', firmId)
        .neq('status', 'closed'),
      getCarrierMapByFirmId(firmId),
    ]);

  if (firmUsersError || profileRowsError || claimRowsError || !firmUsers) {
    throw new Error(
      firmUsersError?.message ||
        profileRowsError?.message ||
        claimRowsError?.message ||
        'Unable to load adjusters.',
    );
  }

  const typedFirmUsers = (firmUsers ?? []) as RawFirmUserRow[];
  const typedProfileRows = (profileRows ?? []) as RawAdjusterProfileRow[];
  const typedClaimRows = (claimRows ?? []) as RawClaimAssignmentRow[];
  const emailsByUserId = await getUserEmailsById(
    typedFirmUsers
      .map((row) => row.user_id)
      .filter((value): value is string => Boolean(value)),
  );

  const profileByUserId = new Map(
    typedProfileRows
      .filter((row): row is RawAdjusterProfileRow & { user_id: string } => Boolean(row.user_id))
      .map((row) => [row.user_id, row]),
  );

  const activeClaimsByUserId = new Map<string, number>();
  for (const row of typedClaimRows) {
    if (!row.assigned_user_id) {
      continue;
    }
    activeClaimsByUserId.set(row.assigned_user_id, (activeClaimsByUserId.get(row.assigned_user_id) ?? 0) + 1);
  }

  return {
    firmUsers: typedFirmUsers,
    profileByUserId,
    activeClaimsByUserId,
    carrierMap,
    emailsByUserId,
  };
}

function mapAdjusterRow(
  user: RawFirmUserRow & { user_id: string },
  profile: RawAdjusterProfileRow | undefined,
  email: string,
  activeClaims: number,
): AdjusterRow {
  const homeBases = parseHomeBases(profile?.home_bases);
  const displayName = getDisplayName(user.first_name, user.last_name, user.full_name, email);

  const row: AdjusterRow = {
    userId: user.user_id,
    firmUserId: user.id,
    firstName: normalizeString(user.first_name),
    lastName: normalizeString(user.last_name),
    fullName: normalizeString(user.full_name),
    displayName,
    initials: getInitials(user.first_name, user.last_name, user.full_name, email),
    email,
    isActive: user.is_active !== false,
    role: user.role,
    invitedAt: user.invited_at,
    joinedAt: user.joined_at,
    maxActiveClaims: profile?.max_active_claims ?? 10,
    certifications: profile?.certifications ?? [],
    approvedClaimTypes: profile?.approved_claim_types ?? [],
    approvedCarriers: profile?.approved_carriers ?? [],
    homeBases,
    availability: profile?.availability ?? 'remote',
    activeClaims,
    profileComplete: false,
  };

  row.profileComplete = isProfileComplete(row);
  return row;
}

export async function getAdjusters(firmId: string): Promise<AdjusterRow[]> {
  const { firmUsers, profileByUserId, activeClaimsByUserId, emailsByUserId } = await getAdjusterData(firmId);

  return firmUsers
    .filter((user): user is RawFirmUserRow & { user_id: string } => Boolean(user.user_id))
    .map((user) =>
      mapAdjusterRow(
        user,
        profileByUserId.get(user.user_id),
        emailsByUserId.get(user.user_id) ?? '',
        activeClaimsByUserId.get(user.user_id) ?? 0,
      ),
    );
}

export async function getAdjusterById(firmId: string, userId: string): Promise<AdjusterRow | null> {
  const adjusters = await getAdjusters(firmId);
  return adjusters.find((adjuster) => adjuster.userId === userId) ?? null;
}

export async function updateAdjusterProfile(
  firmId: string,
  userId: string,
  updates: Partial<AdjusterProfileUpdate>,
): Promise<void> {
  const supabase = createAdminClient();
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('adjuster_profiles')
    .select('id, max_active_claims, certifications, approved_claim_types, approved_carriers, home_bases, availability')
    .eq('firm_id', firmId)
    .eq('user_id', userId)
    .maybeSingle<RawAdjusterProfileRow & { id: string }>();

  if (existingProfileError) {
    throw new Error(existingProfileError.message);
  }

  const nextProfile = {
    firm_id: firmId,
    user_id: userId,
    max_active_claims: updates.maxActiveClaims ?? existingProfile?.max_active_claims ?? 10,
    certifications: updates.certifications ?? existingProfile?.certifications ?? [],
    approved_claim_types: updates.approvedClaimTypes ?? existingProfile?.approved_claim_types ?? [],
    approved_carriers: updates.approvedCarriers ?? existingProfile?.approved_carriers ?? [],
    home_bases: updates.homeBases ?? parseHomeBases(existingProfile?.home_bases),
    availability: updates.availability ?? existingProfile?.availability ?? 'remote',
    updated_at: new Date().toISOString(),
  };

  const operation = existingProfile?.id
    ? supabase.from('adjuster_profiles').update(nextProfile).eq('id', existingProfile.id)
    : supabase.from('adjuster_profiles').insert({
        ...nextProfile,
        created_at: new Date().toISOString(),
      });

  const { error } = await operation;
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAdjusterUser(
  firmId: string,
  userId: string,
  updates: Partial<AdjusterUserUpdate>,
): Promise<void> {
  const supabase = createAdminClient();
  const { data: existingUser, error: existingUserError } = await supabase
    .from('firm_users')
    .select('first_name, last_name, full_name, is_active')
    .eq('firm_id', firmId)
    .eq('user_id', userId)
    .eq('role', 'adjuster')
    .single<Pick<RawFirmUserRow, 'first_name' | 'last_name' | 'full_name' | 'is_active'>>();

  if (existingUserError) {
    throw new Error(existingUserError.message);
  }

  const nextFirstName = normalizeString(updates.firstName) ?? normalizeString(existingUser.first_name);
  const nextLastName = normalizeString(updates.lastName) ?? normalizeString(existingUser.last_name);
  const nextFullName = composeFullName(nextFirstName, nextLastName) ?? normalizeString(existingUser.full_name);

  const { error } = await supabase
    .from('firm_users')
    .update({
      first_name: nextFirstName,
      last_name: nextLastName,
      full_name: nextFullName,
      is_active: updates.isActive ?? (existingUser.is_active !== false),
    })
    .eq('firm_id', firmId)
    .eq('user_id', userId)
    .eq('role', 'adjuster');

  if (error) {
    throw new Error(error.message);
  }
}

async function getCarrierOptionsByFirmId(firmId: string): Promise<CarrierOption[]> {
  const carrierMap = await getCarrierMapByFirmId(firmId);
  return Array.from(carrierMap.entries()).map(([id, name]) => ({ id, name }));
}

export async function getAdjusterOptions(firmId: string): Promise<AdjusterOption[]> {
  const adjusters = await getAdjusters(firmId);
  return adjusters
    .filter((adjuster) => adjuster.isActive)
    .map((adjuster) => ({
      id: adjuster.firmUserId,
      userId: adjuster.userId,
      email: adjuster.email,
    }));
}

export async function getAdjustersForDispatchAdmin(firmId: string): Promise<DispatchAdjuster[]> {
  const adjusters = await getAdjusters(firmId);
  const carrierMap = await getCarrierMapByFirmId(firmId);

  return adjusters
    .filter((adjuster) => adjuster.isActive)
    .map((adjuster) => {
      const primaryHomeBase = getPrimaryHomeBase(adjuster.homeBases);
      return {
        id: adjuster.userId,
        name: adjuster.displayName,
        initials: adjuster.initials,
        location: getLocationLabel(adjuster.homeBases),
        activeClaims: adjuster.activeClaims,
        maxClaims: adjuster.maxActiveClaims,
        availability: adjuster.availability,
        approvedCarriers: adjuster.approvedCarriers.map((carrierId) => carrierMap.get(carrierId) ?? carrierId),
        approvedClaimTypes: adjuster.approvedClaimTypes,
        certifications: adjuster.certifications,
        homeLat: primaryHomeBase?.lat ?? null,
        homeLng: primaryHomeBase?.lng ?? null,
      } satisfies DispatchAdjuster;
    });
}

export async function getAdjusterProfilesForFirmAdmin(firmId: string): Promise<AdminAdjusterProfile[]> {
  const adjusters = await getAdjusters(firmId);
  const carrierMap = await getCarrierMapByFirmId(firmId);

  return adjusters.map((adjuster) => {
    const primaryHomeBase = getPrimaryHomeBase(adjuster.homeBases);
    return {
      id: adjuster.userId,
      name: adjuster.displayName,
      initials: adjuster.initials,
      email: adjuster.email,
      status: adjuster.isActive ? 'Active' : 'Inactive',
      availability: adjuster.availability,
      location: getLocationLabel(adjuster.homeBases),
      activeClaims: adjuster.activeClaims,
      maxClaims: adjuster.maxActiveClaims,
      certifications: adjuster.certifications,
      approvedClaimTypes: adjuster.approvedClaimTypes,
      approvedCarrierIds: adjuster.approvedCarriers,
      approvedCarriers: adjuster.approvedCarriers.map((carrierId) => carrierMap.get(carrierId) ?? carrierId),
      homeBaseCity: primaryHomeBase?.city ?? '',
      homeBaseState: primaryHomeBase?.state ?? '',
      homeBaseZip: primaryHomeBase?.zip ?? '',
      homeLat: primaryHomeBase?.lat ?? null,
      homeLng: primaryHomeBase?.lng ?? null,
      profileConfigured: adjuster.profileComplete,
    };
  });
}

export async function getAdjusterProfileByIdAdmin(firmId: string, adjusterId: string): Promise<AdminAdjusterProfile | null> {
  const adjusters = await getAdjusterProfilesForFirmAdmin(firmId);
  return adjusters.find((adjuster) => adjuster.id === adjusterId) ?? null;
}

export async function getCarrierOptionsForFirmAdmin(firmId: string): Promise<CarrierOption[]> {
  return getCarrierOptionsByFirmId(firmId);
}

export { getUserEmailsById };
