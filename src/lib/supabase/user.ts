import { redirect } from 'next/navigation';
import type { Role } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface FirmUserRecord {
  role: Role;
  firm_id: string;
  full_name: string | null;
}

interface FirmRecord {
  name: string;
}

export interface AuthenticatedFirmUser {
  id: string;
  email: string;
  role: Role;
  firmId: string;
  firmName: string;
  name: string;
}

export async function getAuthenticatedFirmUser(): Promise<AuthenticatedFirmUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  const { data: firmUser } = await supabase
    .from('firm_users')
    .select('role, firm_id, full_name')
    .eq('user_id', user.id)
    .single<FirmUserRecord>();

  if (!firmUser) {
    return null;
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('name')
    .eq('id', firmUser.firm_id)
    .single<FirmRecord>();

  // Lazily create adjuster_profiles row on first login. We cannot create
  // it at invite time because the invited user does not exist in auth.users
  // until they accept the invite, and adjuster_profiles.user_id has an FK
  // to auth.users.
  if (firmUser.role === 'adjuster') {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('adjuster_profiles')
      .select('id')
      .eq('firm_id', firmUser.firm_id)
      .eq('user_id', user.id)
      .maybeSingle<{ id: string }>();
    if (!existing) {
      const nowIso = new Date().toISOString();
      await admin.from('adjuster_profiles').insert({
        firm_id: firmUser.firm_id,
        user_id: user.id,
        max_active_claims: 10,
        certifications: [],
        approved_claim_types: [],
        approved_carriers: [],
        home_bases: [],
        availability: 'available',
        created_at: nowIso,
        updated_at: nowIso,
      });
    }
  }

  return {
    id: user.id,
    email: user.email,
    role: firmUser.role,
    firmId: firmUser.firm_id,
    firmName: firm?.name ?? 'Firm',
    name: firmUser.full_name?.trim() || user.email.split('@')[0] || 'User',
  };
}

export async function requireAuthenticatedFirmUser(): Promise<AuthenticatedFirmUser> {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    redirect('/signin');
  }

  return firmUser;
}
