import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function CoveragesTab() {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Coverage Limits</div>
        <Button size="sm">Edit</Button>
      </div>
      <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No coverage limits entered yet.</div>
    </Card>
  );
}
