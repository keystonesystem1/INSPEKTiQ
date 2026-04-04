import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function CarrierFormsTab() {
  return (
    <Card>
      {['Proof of Loss', 'Carrier Photo Index', 'Final Report Template'].map((form) => (
        <div key={form} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div>{form}</div>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>From carrier document library</div>
          </div>
          <Button size="sm" variant="ghost">Download</Button>
        </div>
      ))}
    </Card>
  );
}
