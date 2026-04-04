import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ClaimantsTab() {
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="sm">Add Claimant</Button>
      </div>
      <Card>
        <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No claimants added yet.</div>
      </Card>
    </div>
  );
}
