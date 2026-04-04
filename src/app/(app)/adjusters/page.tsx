import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { demoAdjusters } from '@/lib/utils/demo-data';

export default function AdjustersPage() {
  return (
    <div>
      <PageHeader title="Adjusters" subtitle="Roster, capability profiles, documents, and pay history." actions={<Button>Invite Adjuster</Button>} />
      <Table columns={['Name', 'Status', 'Active Claims', 'Completed', 'Avg SLA %', 'Paid YTD', 'Avg per Claim', 'Docs', 'Actions']}>
        {demoAdjusters.map((adjuster) => (
          <tr key={adjuster.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '12px 14px' }}>
              <Link href={`/adjusters/${adjuster.id}`} style={{ color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                {adjuster.name}
              </Link>
            </td>
            <td style={{ padding: '12px 14px' }}>{adjuster.status}</td>
            <td style={{ padding: '12px 14px' }}>{adjuster.activeClaims}</td>
            <td style={{ padding: '12px 14px' }}>{adjuster.completed}</td>
            <td style={{ padding: '12px 14px' }}>{adjuster.avgSla}</td>
            <td style={{ padding: '12px 14px' }}>{adjuster.paidYtd}</td>
            <td style={{ padding: '12px 14px' }}>{adjuster.avgPerClaim}</td>
            <td style={{ padding: '12px 14px' }}>4</td>
            <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>Open</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
