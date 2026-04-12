'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { TopNav } from '@/components/nav/TopNav';
import { useUser } from '@/hooks/useUser';
import type { UserSession } from '@/lib/types';
import { canAccessTab } from '@/lib/utils/roles';

export function AppShell({
  initialUser,
  children,
}: {
  initialUser: UserSession;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUser();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  useEffect(() => {
    const firstSegment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
    if (!canAccessTab(initialUser.role, firstSegment)) {
      router.replace('/dashboard');
    }
  }, [initialUser.role, pathname, router]);

  return (
    <>
      <TopNav user={user ?? initialUser} />
      <div style={{ minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>
        <main className="page-enter" style={{ padding: '32px 40px' }}>
          {children}
        </main>
      </div>
    </>
  );
}
