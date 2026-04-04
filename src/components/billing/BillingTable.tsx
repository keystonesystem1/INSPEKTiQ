import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { demoInvoices } from '@/lib/utils/demo-data';

export function BillingTable() {
  return (
    <Table columns={['Date', 'Claim #', 'Insured', 'Invoice Type', '% Comm', 'Service Fee', 'Mileage', 'Other', 'Total Due', 'Status', 'Actions']}>
      {demoInvoices.map((invoice) => (
        <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '12px 14px' }}>{invoice.date}</td>
          <td style={{ padding: '12px 14px', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{invoice.claimNumber}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.insured}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.invoiceType}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.commission}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.serviceFee}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.mileage}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.other}</td>
          <td style={{ padding: '12px 14px' }}>{invoice.totalDue}</td>
          <td style={{ padding: '12px 14px' }}>
            <Badge tone={invoice.status === 'Paid' ? 'sage' : invoice.status === 'Approved' ? 'blue' : invoice.status === 'Disputed' ? 'red' : 'orange'}>
              {invoice.status}
            </Badge>
          </td>
          <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>Review</td>
        </tr>
      ))}
    </Table>
  );
}
