import { Card } from '@/components/ui/Card';

export function CarrierFormsTab() {
  return (
    <Card>
      {['Proof of Loss', 'Carrier Photo Index', 'Final Report Template'].map((form) => (
        <div key={form} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div>{form}</div>
          <div style={{ color: 'var(--muted)', fontSize: '11px' }}>From carrier document library</div>
        </div>
      ))}
    </Card>
  );
}
