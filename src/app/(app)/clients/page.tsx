import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { demoClients } from '@/lib/utils/demo-data';

export default function ClientsPage() {
  return (
    <div>
      <PageHeader title="Clients" subtitle="Carrier relationships, document libraries, and fee schedules." actions={<Button>New Client</Button>} />
      <Table columns={['Client Name', 'Primary Contact', 'Active States', 'Open Claims', 'Fee Bill', 'Guidelines', 'Actions']}>
        {demoClients.map((client) => (
          <tr key={client.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '12px 14px' }}>
              <Link href={`/clients/${client.id}`} style={{ color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                {client.name}
              </Link>
            </td>
            <td style={{ padding: '12px 14px' }}>{client.primaryContact}</td>
            <td style={{ padding: '12px 14px' }}>{client.activeStates.join(', ')}</td>
            <td style={{ padding: '12px 14px' }}>{client.openClaims}</td>
            <td style={{ padding: '12px 14px' }}>{client.feeBill}</td>
            <td style={{ padding: '12px 14px' }}>{client.guidelines}</td>
            <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>Open</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
