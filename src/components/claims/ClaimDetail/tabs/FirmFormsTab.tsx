import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function FirmFormsTab() {
  return (
    <Card>
      {['Keystone QA Checklist', 'Field Scope Summary', 'Photo Naming Guide'].map((form) => (
        <div key={form} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div>{form}</div>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Firm-level document library</div>
          </div>
          <Button size="sm" variant="ghost">Download</Button>
        </div>
      ))}
    </Card>
  );
}
