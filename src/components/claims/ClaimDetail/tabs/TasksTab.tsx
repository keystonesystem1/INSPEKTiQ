import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function TasksTab() {
  const tasks = [
    ['Pull weather history report', 'Avery Stone', 'Apr 5', false],
    ['Confirm detached shed measurements', 'Jordan Ames', 'Apr 6', false],
    ['Upload approved report set', 'Nina Price', 'Apr 7', true],
  ] as const;

  return (
    <Card>
      {tasks.map(([title, assignedTo, due, done]) => (
        <div key={title} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1.5px solid ${done ? 'var(--sage)' : 'var(--border)'}`, background: done ? 'var(--sage)' : 'transparent', display: 'grid', placeItems: 'center' }}>{done ? '✓' : ''}</div>
          <div style={{ flex: 1 }}>
            <div style={{ textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--muted)' : 'var(--white)' }}>{title}</div>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{assignedTo} · Due {due}</div>
          </div>
          <Badge tone={done ? 'sage' : 'orange'}>{done ? 'Done' : 'Open'}</Badge>
        </div>
      ))}
    </Card>
  );
}
