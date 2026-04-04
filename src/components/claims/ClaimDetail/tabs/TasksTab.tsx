import { Button } from '@/components/ui/Button';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Open', 'Done'].map((label, index) => (
            <button key={label} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', color: index === 0 ? 'var(--sage)' : 'var(--muted)', background: index === 0 ? 'var(--sage-dim)' : 'transparent', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</button>
          ))}
        </div>
        <Button size="sm">Add Task</Button>
      </div>
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
