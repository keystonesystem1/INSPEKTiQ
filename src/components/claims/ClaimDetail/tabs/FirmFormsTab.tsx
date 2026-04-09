import { Card } from '@/components/ui/Card';

// TODO: Pull firm documents from a `firm_documents` table keyed by firm_id.
// This tab should list templates and SOPs uploaded by the firm admin.
export function FirmFormsTab() {
  return (
    <Card>
      <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px 0' }}>
        No firm forms have been uploaded yet.
      </div>
    </Card>
  );
}
