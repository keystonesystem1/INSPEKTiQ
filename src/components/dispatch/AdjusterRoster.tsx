'use client';

import { demoAdjusters } from '@/lib/utils/demo-data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function AdjusterRoster({
  onAssign,
}: {
  onAssign: (adjusterId: string) => void;
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {demoAdjusters.map((adjuster) => (
        <div key={adjuster.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--blue-dim)', color: 'var(--blue)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>{adjuster.initials}</div>
            <div style={{ flex: 1 }}>
              <div>{adjuster.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{adjuster.location}</div>
            </div>
          </div>
          <div style={{ height: '3px', borderRadius: '999px', background: 'var(--border)', marginBottom: '6px' }}>
            <div style={{ width: `${(adjuster.activeClaims / adjuster.maxClaims) * 100}%`, height: '100%', borderRadius: '999px', background: 'var(--sage)' }} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--faint)', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: '8px' }}>{adjuster.activeClaims}/{adjuster.maxClaims} active</div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {adjuster.certifications.map((certification) => <Badge key={certification} tone="blue">{certification}</Badge>)}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" onClick={() => onAssign(adjuster.id)}>Assign Claims</Button>
            <Button size="sm" variant="ghost">Profile</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
