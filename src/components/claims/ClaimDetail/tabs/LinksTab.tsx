import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Claim } from '@/lib/types';

export function LinksTab({ claim }: { claim: Claim }) {
  const links = [
    ['Xactimate', 'https://xactimate.com'],
    ['Eagle View', 'https://eagleview.com'],
    ['Google Maps', `https://maps.google.com/?q=${encodeURIComponent(claim.address)}`],
    ['Weather History', 'https://www.wunderground.com/history'],
  ];

  return (
    <Card>
      {links.map(([label, href], index) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div>{index + 1}. {label}</div>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{href}</div>
          </div>
          <a href={href} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost">Open</Button></a>
        </div>
      ))}
    </Card>
  );
}
