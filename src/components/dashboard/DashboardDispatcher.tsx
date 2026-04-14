import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getCardDefs, mergeLayout, defaultLayout } from '@/lib/dashboard-cards';
import type { CardLayoutItem } from '@/lib/dashboard-cards';
import type { DispatcherDashboardData } from '@/lib/supabase/dashboard';

const LABEL: React.CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '14px',
};

function EmptyState({ message }: { message: string }) {
  return <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{message}</p>;
}

export function DashboardDispatcher({
  data,
  savedLayout,
}: {
  data: DispatcherDashboardData;
  savedLayout: CardLayoutItem[] | null;
}) {
  const role = 'dispatcher';
  const defs = getCardDefs(role);
  const layout = savedLayout ? mergeLayout(savedLayout, role) : defaultLayout(role);
  const { unassignedClaims, stats } = data;

  const cardContent: Record<string, React.ReactNode> = {
    stats: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Unassigned" value={String(stats.unassigned)} accent="var(--orange)" />
        <StatCard label="Scheduled Today" value={String(stats.scheduledToday)} accent="var(--blue)" />
        <StatCard label="Available Adjusters" value={String(stats.availableAdjusters)} accent="var(--sage)" />
      </div>
    ),

    unassigned_queue: (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...LABEL }}>
          <span>Unassigned Queue</span>
          <a href="/dispatch" style={{ fontWeight: 400, fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: 0, textTransform: 'none' }}>
            Open Dispatch →
          </a>
        </div>
        {unassignedClaims.length === 0 ? (
          <EmptyState message="No unassigned claims — the queue is clear." />
        ) : (
          unassignedClaims.map((claim) => (
            <div
              key={claim.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '13px' }}>{claim.insured}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{claim.number} · {claim.address}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{claim.carrier} · {claim.type}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Badge tone="orange">Unassigned</Badge>
                <a href={`/dispatch?claim=${claim.id}`}>
                  <Button size="sm" variant="primary">Assign</Button>
                </a>
              </div>
            </div>
          ))
        )}
      </Card>
    ),

    availability: (
      <Card>
        <div style={LABEL}>Adjuster Availability</div>
        {stats.availableAdjusters === 0 ? (
          <EmptyState message="No adjusters are marked available — update adjuster profiles in the Adjusters tab." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '36px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, color: 'var(--white)' }}>
              {stats.availableAdjusters}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              {stats.availableAdjusters === 1 ? 'adjuster' : 'adjusters'} available to take new claims
            </div>
            <a href="/adjusters" style={{ fontSize: '12px', color: 'var(--sage)', textDecoration: 'none', marginTop: '4px' }}>
              View roster →
            </a>
          </div>
        )}
      </Card>
    ),
  };

  const header = (
    <div>
      <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>
        Dispatcher Dashboard
      </h1>
      <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
    </div>
  );

  return <DashboardLayout cardDefs={defs} initialLayout={layout} cardContent={cardContent} header={header} />;
}
