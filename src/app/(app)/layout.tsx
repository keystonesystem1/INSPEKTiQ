import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const firmUser = await requireAuthenticatedFirmUser();

  // Local demo fallback retained for development reference:
  // const cookieStore = await cookies();
  // const role = getRoleFromCookie(cookieStore.get('inspektiq-role')?.value) as Role | null;
  // if (!role) redirect('/signin');
  // const userName = cookieStore.get('inspektiq-name')?.value ?? 'Avery Stone';
  // const email = cookieStore.get('inspektiq-email')?.value ?? 'avery@keystoneclaims.io';
  // const firmName = cookieStore.get('inspektiq-firm')?.value ?? 'Keystone Claims';

  return (
    <AppShell
      initialUser={{
        id: firmUser.id,
        name: firmUser.name,
        email: firmUser.email,
        firmId: firmUser.firmId,
        firmName: 'Keystone Claims',
        role: firmUser.role,
      }}
    >
      {children}
    </AppShell>
  );
}
