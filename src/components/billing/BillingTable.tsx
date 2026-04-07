import { Table } from '@/components/ui/Table';

export function BillingTable() {
  return (
    <Table columns={['Date', 'Claim #', 'Insured', 'Invoice Type', '% Comm', 'Service Fee', 'Mileage', 'Other', 'Total Due', 'Status', 'Actions']}>
      <tr>
        <td colSpan={11} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
          No invoices yet.
        </td>
      </tr>
    </Table>
  );
}
