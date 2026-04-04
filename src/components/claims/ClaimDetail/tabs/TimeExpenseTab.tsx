import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Role } from '@/lib/types';

export function TimeExpenseTab({ role }: { role: Role }) {
  const rows = [
    ['2026-04-02', 'Field inspection travel', 'Drive Time', '$125.00'],
    ['2026-04-03', 'Mileage to loss site', 'Mileage', '$48.00'],
    ['2026-04-03', 'Estimate review', 'Time', '$190.00'],
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Entries</div>
        {role === 'adjuster' ? <Button size="sm">Add Entry</Button> : null}
      </div>
      {rows.map((row) => (
        <div key={row.join('-')} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px 80px', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          {row.map((cell) => <div key={cell}>{cell}</div>)}
        </div>
      ))}
    </Card>
  );
}
