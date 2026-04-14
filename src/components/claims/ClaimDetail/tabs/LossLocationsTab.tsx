import { Card } from '@/components/ui/Card';
import type { Claim } from '@/lib/types';

export function LossLocationsTab({ claim }: { claim: Claim }) {
  return (
    <Card>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Locations</div>
      </div>
      <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 500 }}>Primary Loss Location</div>
        <div style={{ color: 'var(--muted)', marginTop: '4px' }}>{claim.address}</div>
        {(claim.city || claim.state) ? (
          <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
            {[claim.city, claim.state, claim.zip].filter(Boolean).join(', ')}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
