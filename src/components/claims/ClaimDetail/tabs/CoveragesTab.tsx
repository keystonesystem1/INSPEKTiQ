import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function CoveragesTab() {
  const rows = [
    ['Coverage A · Dwelling', '$225,000'],
    ['Coverage B · Other Structures', '$22,500'],
    ['Coverage C · Personal Property', '$110,000'],
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Coverage Limits</div>
        <Button size="sm">Edit</Button>
      </div>
      {rows.map(([type, amount]) => (
        <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)' }}>{type}</span>
          <strong style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '14px' }}>{amount}</strong>
        </div>
      ))}
    </Card>
  );
}
