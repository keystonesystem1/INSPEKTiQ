'use client';

import Link from 'next/link';
import { useMemo, useTransition, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { NavTab } from '@/components/nav/NavTab';
import { createClient } from '@/lib/supabase/client';
import type { UserSession } from '@/lib/types';
import { ROLE_TABS } from '@/lib/utils/roles';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  claims: 'Claims',
  clients: 'Clients',
  dispatch: 'Dispatch',
  adjusters: 'Adjusters',
  calendar: 'Calendar',
  billing: 'Billing',
  settings: 'Settings',
  'workflow-studio': 'Workflow Studio',
};

export function TopNav({ user }: { user: UserSession }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const tabs = useMemo(() => ROLE_TABS[user.role], [user.role]);
  const [searchValue, setSearchValue] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (value.trim()) {
        router.replace(`/claims?search=${encodeURIComponent(value.trim())}`);
      } else {
        router.replace('/claims');
      }
    }, 300);
  }

  return (
    <nav
      style={{
        height: 'var(--nav-h)',
        position: 'fixed',
        inset: '0 0 auto 0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: 'rgba(9, 9, 9, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 rgba(0, 0, 0, 0.4)',
        zIndex: 100,
      }}
    >
      <Link
        href="/dashboard"
        style={{
          marginRight: '36px',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '18px',
          fontWeight: 900,
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ color: 'var(--white)' }}>INSPEKT</span>
        <span style={{ color: 'var(--sage)' }}>iQ</span>
      </Link>

      <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '2px' }}>
        {tabs.map((tab) => (
          <NavTab key={tab} href={`/${tab}`} label={labels[tab]} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--faint)',
            }}
          >
            ⌕
          </span>
          <input
            placeholder="Search claims, clients, adjusters"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '260px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0',
              color: 'var(--white)',
              padding: '7px 12px 7px 34px',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar initials={user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)} />
          <div style={{ display: 'grid', gap: '1px' }}>
            <span
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {user.name}
            </span>
            <button
              onClick={() => {
                startTransition(async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.replace('/signin');
                  router.refresh();
                });
              }}
              disabled={isPending}
              style={{ color: 'var(--muted)', textAlign: 'left', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
