import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function DocumentsTab() {
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
      <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No documents uploaded yet.</div>
    </Card>
  );
}
