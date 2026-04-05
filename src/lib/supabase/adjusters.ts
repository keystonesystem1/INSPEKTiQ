import { createAdminClient } from '@/lib/supabase/admin';

export interface AdjusterOption {
  id: string;
  userId: string;
  email: string;
}

export interface DispatchAdjuster {
  id: string;
  userId: string;
  email: string;
  initials: string;
  activeClaims: number;
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

export async function getDispatchAdjusters(firmId: string): Promise<DispatchAdjuster[]> {
  const supabase = createAdminClient();

  const { data: firmUsers, error } = await supabase
    .from('firm_users')
    .select('id, user_id')
    .eq('firm_id', firmId)
    .eq('role', 'adjuster')
    .eq('is_active', true);

  if (error || !firmUsers?.length) return [];

  const userIds = firmUsers
    .map((row) => row.user_id)
    .filter((value): value is string => Boolean(value));

  if (!userIds.length) return [];

  const [usersById, claimCounts] = await Promise.all([
    getUserEmailsById(userIds),
    getActiveClaimCounts(firmId, userIds),
  ]);

  return firmUsers
    .map((row) => {
      const email = usersById.get(row.user_id as string) ?? '';
      const prefix = email.split('@')[0] ?? '';
      return {
        id: row.id as string,
        userId: row.user_id as string,
        email,
        initials: prefix.slice(0, 2).toUpperCase(),
        activeClaims: claimCounts.get(row.user_id as string) ?? 0,
      };
    })
    .filter((row) => row.email);
}

async function getActiveClaimCounts(firmId: string, userIds: string[]): Promise<Map<string, number>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('claims')
    .select('assigned_user_id')
    .eq('firm_id', firmId)
    .in('assigned_user_id', userIds)
    .not('status', 'in', '("closed","submitted")');

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const uid = row.assigned_user_id as string;
    counts.set(uid, (counts.get(uid) ?? 0) + 1);
  }
  return counts;
}

export { getUserEmailsById };
