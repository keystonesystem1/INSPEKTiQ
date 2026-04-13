import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const firmUser = await requireAuthenticatedFirmUser();

  return (
    <ThemeProvider>
      <AppShell
        initialUser={{
          id: firmUser.id,
          name: firmUser.name,
          email: firmUser.email,
          firmId: firmUser.firmId,
          firmName: firmUser.firmName,
          role: firmUser.role,
        }}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  );
}
