import { createAdminClient } from '@/lib/supabase/admin';

export interface AdjusterOption {
  id: string;
  userId: string;
  email: string;
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

export { getUserEmailsById };
