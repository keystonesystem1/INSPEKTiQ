import { redirect } from 'next/navigation';
import type { Role } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

interface FirmUserRecord {
  role: Role;
  firm_id: string;
  name: string | null;
}

export interface AuthenticatedFirmUser {
  id: string;
  email: string;
  role: Role;
  firmId: string;
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
    .select('role, firm_id, name')
    .eq('id', user.id)
    .single<FirmUserRecord>();

  if (!firmUser) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: firmUser.role,
    firmId: firmUser.firm_id,
    name: firmUser.name ?? user.email.split('@')[0] ?? 'User',
  };
}

export async function requireAuthenticatedFirmUser(): Promise<AuthenticatedFirmUser> {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    redirect('/signin');
  }

  return firmUser;
}
