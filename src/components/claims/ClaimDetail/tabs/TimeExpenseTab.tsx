import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Role } from '@/lib/types';

export function TimeExpenseTab({ role }: { role: Role }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Entries</div>
        {role === 'adjuster' ? <Button size="sm">Add Entry</Button> : null}
      </div>
      <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No time or expense entries yet.</div>
    </Card>
  );
}
