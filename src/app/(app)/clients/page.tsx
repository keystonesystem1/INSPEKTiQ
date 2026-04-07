import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ClientsPage() {
  return (
    <div>
      <PageHeader title="Clients" subtitle="Carrier relationships, document libraries, and fee schedules." actions={<Button>New Client</Button>} />
      <Card>
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
          No clients added yet.
        </div>
      </Card>
    </div>
  );
}
