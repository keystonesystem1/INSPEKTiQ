import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function DocumentsTab() {
  const files = [
    ['Report', 'Draft estimate packet', '3.2 MB', 'Apr 4', 'Pending'],
    ['Carrier', 'Policy declaration', '814 KB', 'Apr 2', 'Reviewed'],
    ['Adjuster', 'Roof slope photos', '42 MB', 'Apr 3', 'Synced'],
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All Files', 'Reports', 'Carrier', 'Adjuster'].map((label, index) => (
            <button key={label} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: index === 0 ? 'var(--sage-dim)' : 'transparent', color: index === 0 ? 'var(--sage)' : 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </button>
          ))}
        </div>
        <Button size="sm">Upload</Button>
      </div>
      {files.map(([type, title, size, uploaded, status]) => (
        <div key={title} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 90px 90px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)' }}>{type}</span>
          <strong>{title}</strong>
          <span>{size}</span>
          <span>{uploaded}</span>
          <Badge tone={status === 'Pending' ? 'orange' : 'blue'}>{status}</Badge>
        </div>
      ))}
    </Card>
  );
}
