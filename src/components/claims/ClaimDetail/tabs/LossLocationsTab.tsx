import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Claim } from '@/lib/types';

export function LossLocationsTab({ claim }: { claim: Claim }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Locations</div>
        <Button size="sm">Add Location</Button>
      </div>
      <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <div>Loc 1 / Bldg 1</div>
        <div style={{ color: 'var(--muted)' }}>{claim.address}</div>
      </div>
    </Card>
  );
}
