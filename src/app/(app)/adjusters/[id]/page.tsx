import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { getAdjustersForDispatchAdmin } from '@/lib/supabase/adjusters';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

function getAvailabilityLabel(value: 'available' | 'busy' | 'remote' | 'on_leave') {
  if (value === 'available') return 'Available';
  if (value === 'busy') return 'Busy';
  if (value === 'on_leave') return 'On Leave';
  return 'Remote';
}

export default async function AdjusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const firmUser = await requireAuthenticatedFirmUser();
  const adjusters = await getAdjustersForDispatchAdmin(firmUser.firmId);
  const adjuster = adjusters.find((item) => item.id === id);

  if (!adjuster) notFound();

  return (
    <div>
      <PageHeader
        title={adjuster.name}
        subtitle="Overview and dispatch capability profile."
      />
      <div style={{ display: 'grid', gap: '16px' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
            <div>
              <strong>Location</strong>
              <div style={{ color: 'var(--muted)' }}>{adjuster.location}</div>
            </div>
            <div>
              <strong>Active Claims</strong>
              <div style={{ color: 'var(--muted)' }}>
                {adjuster.activeClaims}/{adjuster.maxClaims}
              </div>
            </div>
            <div>
              <strong>Status</strong>
              <div style={{ color: 'var(--muted)' }}>{getAvailabilityLabel(adjuster.availability)}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '12px',
            }}
          >
            Capability Profile
          </div>
          {[
            ['Approved Claim Types', adjuster.approvedClaimTypes.join(', ') || 'Not configured'],
            ['Approved Carriers', adjuster.approvedCarriers.join(', ') || 'Not configured'],
            ['Certifications', adjuster.certifications.join(', ') || 'None listed'],
            ['Home Base', adjuster.location || 'Remote'],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              <strong style={{ textAlign: 'right' }}>{value}</strong>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
