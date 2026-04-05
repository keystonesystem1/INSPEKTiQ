import { redirect } from 'next/navigation';
import type { Role } from '@/lib/types';
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
