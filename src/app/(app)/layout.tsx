import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getRoleFromCookie, type Role } from '@/lib/utils/roles';

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const role = getRoleFromCookie(cookieStore.get('inspektiq-role')?.value) as Role | null;

  if (!role) {
    redirect('/signin');
  }

  const userName = cookieStore.get('inspektiq-name')?.value ?? 'Avery Stone';
  const email = cookieStore.get('inspektiq-email')?.value ?? 'avery@keystoneclaims.io';
  const firmName = cookieStore.get('inspektiq-firm')?.value ?? 'Keystone Claims';

  return (
    <AppShell
      initialUser={{
        id: 'demo-user',
        name: decodeURIComponent(userName),
        email: decodeURIComponent(email),
        firmName: decodeURIComponent(firmName),
        role,
      }}
    >
      {children}
    </AppShell>
  );
}
