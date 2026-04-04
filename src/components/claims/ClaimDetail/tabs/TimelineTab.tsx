import { Card } from '@/components/ui/Card';
import type { TimelineItem } from '@/lib/types';

export function TimelineTab({ items }: { items: TimelineItem[] }) {
  return (
    <Card>
      {items.map((item) => (
        <div key={item.id} style={{ display: 'flex', gap: '14px', padding: '10px 0' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid var(--${item.tone})`, color: `var(--${item.tone})`, display: 'grid', placeItems: 'center', fontSize: '8px' }}>•</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>{item.action}</div>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{item.who}</div>
          </div>
          <div style={{ color: 'var(--faint)', fontSize: '11px' }}>{item.timestamp}</div>
        </div>
      ))}
    </Card>
  );
}
