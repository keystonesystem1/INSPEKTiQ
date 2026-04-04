import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Claim, Role } from '@/lib/types';
import { canApproveClaims } from '@/lib/utils/roles';

export function ReservesTab({ claim, role }: { claim: Claim; role: Role }) {
  const rows = [
    ['Loc 1', 'Dwelling', 'Coverage A', '$12,400'],
    ['Loc 1', 'Detached Shed', 'Coverage B', '$4,250'],
    ['Loc 1', 'Contents', 'Coverage C', '$2,000'],
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Total Reserves</div>
          <div style={{ marginTop: '6px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '28px' }}>${claim.reserveTotal.toLocaleString()}</div>
        </div>
        {canApproveClaims(role) ? <Button size="sm">Add Reserve</Button> : null}
      </div>
      {rows.map((row) => (
        <div key={row.join('-')} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 110px', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          {row.map((cell) => <div key={cell}>{cell}</div>)}
        </div>
      ))}
    </Card>
  );
}
