import { redirect } from 'next/navigation';
import type { Role } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface FirmUserRecord {
  id: string;
  role: Role;
  firm_id: string;
  full_name: string | null;
}

interface FirmRecord {
  name: string;
  phone: string | null;
  settings: Record<string, unknown> | null;
}

export interface AuthenticatedFirmUser {
  id: string;
  email: string;
  role: Role;
  firmId: string;
  firmName: string;
  /** Requires firms.phone column. Null until migrated. */
  firmPhone: string | null;
  /** Requires firms.settings jsonb column. Null until migrated. */
  firmSettings: Record<string, unknown> | null;
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
    .select('id, role, firm_id, full_name')
    .eq('user_id', user.id)
    .single<FirmUserRecord>();

  if (!firmUser) {
    return null;
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('name, phone, settings')
    .eq('id', firmUser.firm_id)
    .single<FirmRecord>();

  // Lazily create adjuster_profiles row on first login. We cannot create
  // it at invite time because the firm_users row is not created until the
  // invited user accepts the invite (firm_users.id is the FK target).
  // adjuster_profiles.user_id references firm_users.id (NOT auth.users.id),
  // so we use firmUser.id here, not user.id.
  if (firmUser.role === 'adjuster') {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('adjuster_profiles')
      .select('id')
      .eq('firm_id', firmUser.firm_id)
      .eq('user_id', firmUser.id)
      .maybeSingle<{ id: string }>();
    if (!existing) {
      const nowIso = new Date().toISOString();
      await admin.from('adjuster_profiles').insert({
        firm_id: firmUser.firm_id,
        user_id: firmUser.id,
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
    firmPhone: firm?.phone ?? null,
    firmSettings: (firm?.settings as Record<string, unknown> | null) ?? null,
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
