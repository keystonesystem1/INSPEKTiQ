'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NewClientModal } from '@/components/clients/NewClientModal';
import type { CarrierRow } from '@/lib/types';

type ClientFilter = 'all' | 'active' | 'portal_enabled' | 'needs_setup';

function matchesFilter(carrier: CarrierRow, filter: ClientFilter) {
  if (filter === 'all') return true;
  if (filter === 'active') return carrier.isActive;
  if (filter === 'portal_enabled') return carrier.portalEnabled && carrier.inviteStatus === 'accepted';
  if (filter === 'needs_setup') {
    return !carrier.portalEnabled || carrier.inviteStatus !== 'accepted' || !carrier.contactEmail;
  }
  return true;
}

function getPortalBadge(carrier: CarrierRow) {
  if (carrier.portalEnabled && carrier.inviteStatus === 'accepted') {
    return { tone: 'sage' as const, label: 'Portal Active' };
  }
  if (carrier.inviteStatus === 'pending') {
    return { tone: 'orange' as const, label: 'Invite Pending' };
  }
  return { tone: 'faint' as const, label: 'No Portal' };
}

function getBillingBadge(carrier: CarrierRow) {
  return carrier.billingPreference === 'desk_adjuster'
    ? { tone: 'blue' as const, label: 'Bill to Desk Adjuster' }
    : { tone: 'blue' as const, label: 'Bill to Contact' };
}

function getLocation(carrier: CarrierRow) {
  const parts = [carrier.city, carrier.state].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function ClientRoster({ carriers }: { carriers: CarrierRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(
    () => carriers.filter((carrier) => matchesFilter(carrier, filter)),
    [carriers, filter],
  );

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {([
          ['all', 'All'],
          ['active', 'Active'],
          ['portal_enabled', 'Portal Enabled'],
          ['needs_setup', 'Needs Setup'],
        ] as Array<[ClientFilter, string]>).map(([value, label]) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              style={{
                borderRadius: 'var(--radius-sm)',
                border: active ? '1px solid rgba(91,194,115,0.25)' : '1px solid var(--border)',
                background: active ? 'var(--sage-dim)' : 'transparent',
                color: active ? 'var(--sage)' : 'var(--muted)',
                padding: '7px 10px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setModalOpen(true)}>New Client</Button>
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div style={{ padding: '18px 20px', color: 'var(--muted)', fontSize: '13px' }}>
            No clients match the current filter.
          </div>
        ) : null}

        {filtered.map((carrier) => {
          const portal = getPortalBadge(carrier);
          const billing = getBillingBadge(carrier);
          return (
            <div
              key={carrier.id}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,1fr)_minmax(140px,auto)_minmax(280px,1fr)_auto]"
              style={{
                gap: '16px',
                alignItems: 'center',
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)' }}>{carrier.name}</div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted)' }}>{getLocation(carrier)}</div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--white)' }}>{carrier.contactName ?? '—'}</div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted)' }}>{carrier.contactEmail ?? '—'}</div>
              </div>

              <div>
                <Badge tone={carrier.activeClaims > 0 ? 'sage' : 'faint'}>
                  {carrier.activeClaims} active
                </Badge>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <Badge tone={portal.tone}>{portal.label}</Badge>
                <Badge tone={billing.tone}>{billing.label}</Badge>
                <Badge tone={carrier.isActive ? 'sage' : 'faint'}>
                  {carrier.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link href={`/clients/${carrier.id}`} style={{ textDecoration: 'none' }}>
                  <Button size="sm">Open Profile</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <NewClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(message) => {
          setToast(message);
          router.refresh();
        }}
      />
      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 16px',
            background: 'var(--sage-dim)',
            color: 'var(--sage)',
            border: '1px solid rgba(91,194,115,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            zIndex: 300,
            boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
