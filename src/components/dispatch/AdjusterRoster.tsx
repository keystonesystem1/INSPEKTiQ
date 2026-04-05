'use client';

import type { DispatchAdjuster } from '@/lib/supabase/adjusters';
import { Button } from '@/components/ui/Button';

export function AdjusterRoster({
  adjusters,
  onAssign,
}: {
  adjusters: DispatchAdjuster[];
  onAssign: (adjusterId: string) => void;
}) {
  if (adjusters.length === 0) {
    return (
      <div style={{ padding: '24px 16px', color: 'var(--muted)', fontSize: '13px' }}>No adjusters found.</div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {adjusters.map((adjuster) => (
        <div key={adjuster.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--blue-dim)', color: 'var(--blue)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>{adjuster.initials}</div>
            <div style={{ flex: 1 }}>
              <div>{adjuster.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{adjuster.activeClaims} active claim{adjuster.activeClaims !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" onClick={() => onAssign(adjuster.userId)}>Assign Claims</Button>
            <Button size="sm" variant="ghost">Profile</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
