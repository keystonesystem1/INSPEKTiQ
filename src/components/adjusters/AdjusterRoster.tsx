'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AdjusterRow } from '@/lib/types';

type AdjusterFilter = 'all' | 'available' | 'busy' | 'needs_setup';

function getAvatarStyle(adjuster: AdjusterRow) {
  if (!adjuster.isActive) {
    return { background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', border: '1px solid var(--border)' };
  }
  if (adjuster.availability === 'available') {
    return { background: 'var(--sage-dim)', color: 'var(--sage)', border: '1px solid rgba(91,194,115,0.2)' };
  }
  if (adjuster.availability === 'busy') {
    return { background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid rgba(224,123,63,0.2)' };
  }
  return { background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', border: '1px solid var(--border)' };
}

function getStatusBadge(adjuster: AdjusterRow) {
  if (!adjuster.isActive) return { tone: 'faint' as const, label: 'Inactive' };
  if (adjuster.availability === 'available') return { tone: 'sage' as const, label: 'Available' };
  if (adjuster.availability === 'busy') return { tone: 'orange' as const, label: 'Busy' };
  if (adjuster.availability === 'on_leave') return { tone: 'red' as const, label: 'On Leave' };
  return { tone: 'faint' as const, label: 'Remote' };
}

function getCapacityWidth(adjuster: AdjusterRow) {
  if (adjuster.maxActiveClaims <= 0) {
    return '0%';
  }
  return `${Math.min(100, (adjuster.activeClaims / adjuster.maxActiveClaims) * 100)}%`;
}

function truncateBadges(values: string[], limit = 2) {
  if (values.length <= limit) {
    return { visible: values, remaining: 0 };
  }

  return {
    visible: values.slice(0, limit),
    remaining: values.length - limit,
  };
}

function matchesFilter(adjuster: AdjusterRow, filter: AdjusterFilter) {
  if (filter === 'all') return true;
  if (filter === 'needs_setup') return !adjuster.profileComplete;
  return adjuster.isActive && adjuster.availability === filter;
}

export function AdjusterRoster({ adjusters }: { adjusters: AdjusterRow[] }) {
  const [filter, setFilter] = useState<AdjusterFilter>('all');

  const filteredAdjusters = useMemo(
    () => adjusters.filter((adjuster) => matchesFilter(adjuster, filter)),
    [adjusters, filter],
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
        }}
      >
        {[
          ['all', 'All'],
          ['available', 'Available'],
          ['busy', 'Busy'],
          ['needs_setup', 'Needs Setup'],
        ].map(([value, label]) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as AdjusterFilter)}
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
      </div>

      <div style={{ display: 'grid', gap: '0' }}>
        {filteredAdjusters.length === 0 ? (
          <div style={{ padding: '18px 20px', color: 'var(--muted)', fontSize: '13px' }}>
            No adjusters match the current filter.
          </div>
        ) : null}

        {filteredAdjusters.map((adjuster) => {
          const status = getStatusBadge(adjuster);
          const avatarStyle = getAvatarStyle(adjuster);
          const certifications = truncateBadges(adjuster.certifications);
          const claimTypes = truncateBadges(adjuster.approvedClaimTypes);

          return (
            <div
              key={adjuster.userId}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1.4fr) minmax(180px,0.7fr) minmax(220px,1fr) minmax(220px,1fr) auto',
                gap: '16px',
                alignItems: 'center',
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '999px',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 800,
                    fontSize: '13px',
                    flexShrink: 0,
                    ...avatarStyle,
                  }}
                >
                  {adjuster.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)' }}>{adjuster.displayName}</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted)' }}>{adjuster.email}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
                <div>
                  <Badge tone={adjuster.profileComplete ? 'sage' : 'orange'}>
                    {adjuster.profileComplete ? 'Ready' : 'Needs Setup'}
                  </Badge>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                  {adjuster.activeClaims}/{adjuster.maxActiveClaims} active claims
                </div>
                <div style={{ height: '4px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: getCapacityWidth(adjuster),
                      height: '100%',
                      borderRadius: '999px',
                      background: adjuster.availability === 'busy' ? 'var(--orange)' : 'var(--sage)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px', minWidth: 0 }}>
                <div>
                  <div
                    style={{
                      marginBottom: '6px',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    Certifications
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {certifications.visible.map((value) => (
                      <Badge key={value} tone="blue">{value}</Badge>
                    ))}
                    {certifications.remaining ? <Badge tone="faint">+{certifications.remaining} more</Badge> : null}
                    {adjuster.certifications.length === 0 ? <Badge tone="faint">None</Badge> : null}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      marginBottom: '6px',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    Claim Types
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {claimTypes.visible.map((value) => (
                      <Badge key={value} tone="faint">{value}</Badge>
                    ))}
                    {claimTypes.remaining ? <Badge tone="faint">+{claimTypes.remaining} more</Badge> : null}
                    {adjuster.approvedClaimTypes.length === 0 ? <Badge tone="faint">None</Badge> : null}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link href={`/adjusters/${adjuster.userId}`} style={{ textDecoration: 'none' }}>
                  <Button size="sm">Open Profile</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
