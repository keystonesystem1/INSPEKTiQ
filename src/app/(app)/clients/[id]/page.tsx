import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { demoClients } from '@/lib/utils/demo-data';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = demoClients.find((item) => item.id === id);

  if (!client) notFound();

  return (
    <div>
      <PageHeader title={client.name} subtitle="Overview, contacts, documents, fee bill, CHECKiT rules, and stats." />
      <div style={{ display: 'grid', gap: '16px' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            <div><strong>Primary Contact</strong><div style={{ color: 'var(--muted)' }}>{client.primaryContact}</div></div>
            <div><strong>Active States</strong><div style={{ color: 'var(--muted)' }}>{client.activeStates.join(', ')}</div></div>
            <div><strong>Open Claims</strong><div style={{ color: 'var(--muted)' }}>{client.openClaims}</div></div>
          </div>
        </Card>
        <Card>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Documents</div>
          {['Fee Bill PDF', 'Guidelines', 'Cheat Sheet', 'GLR Structure Template'].map((document) => (
            <div key={document} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{document}</span>
              <span style={{ color: 'var(--muted)' }}>Download</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
