import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Claim, Role } from '@/lib/types';
import { canApproveClaims } from '@/lib/utils/roles';

export function ReservesTab({ claim, role }: { claim: Claim; role: Role }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Total Reserves</div>
          <div style={{ marginTop: '6px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '28px' }}>${claim.reserveTotal.toLocaleString()}</div>
        </div>
        {canApproveClaims(role) ? <Button size="sm">Add Reserve</Button> : null}
      </div>
      <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No reserve line items yet.</div>
    </Card>
  );
}
