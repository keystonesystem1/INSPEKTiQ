import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { demoAdjusters } from '@/lib/utils/demo-data';

export default async function AdjusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adjuster = demoAdjusters.find((item) => item.id === id);

  if (!adjuster) notFound();

  return (
    <div>
      <PageHeader title={adjuster.name} subtitle="Overview, capability profile, documents, and pay history." />
      <div style={{ display: 'grid', gap: '16px' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            <div><strong>Location</strong><div style={{ color: 'var(--muted)' }}>{adjuster.location}</div></div>
            <div><strong>Active Claims</strong><div style={{ color: 'var(--muted)' }}>{adjuster.activeClaims}/{adjuster.maxClaims}</div></div>
            <div><strong>Status</strong><div style={{ color: 'var(--muted)' }}>{adjuster.status}</div></div>
          </div>
        </Card>
        <Card>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>Capability Profile</div>
          {[
            ['Approved Claim Types', adjuster.approvedClaimTypes.join(', ')],
            ['Approved Carriers', adjuster.approvedCarriers.join(', ')],
            ['Certifications', adjuster.certifications.join(', ')],
            ['Home Bases', adjuster.homeBases.join(', ')],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              <strong style={{ textAlign: 'right' }}>{value}</strong>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
