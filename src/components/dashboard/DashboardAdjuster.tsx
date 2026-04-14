import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getCardDefs, mergeLayout, defaultLayout } from '@/lib/dashboard-cards';
import type { CardLayoutItem } from '@/lib/dashboard-cards';
import type { AdjusterDashboardData } from '@/lib/supabase/dashboard';

const LABEL: React.CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '14px',
};

const STATUS_TONE: Record<string, 'sage' | 'orange' | 'blue' | 'red' | 'faint'> = {
  assigned: 'blue',
  accepted: 'blue',
  contact_attempted: 'blue',
  contacted: 'blue',
  scheduled: 'sage',
  inspection_started: 'sage',
  inspection_completed: 'sage',
  in_review: 'orange',
  on_hold: 'faint',
  needs_attention: 'red',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function EmptyState({ message }: { message: string }) {
  return <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{message}</p>;
}

export function DashboardAdjuster({
  name,
  data,
  savedLayout,
}: {
  name: string;
  data: AdjusterDashboardData;
  savedLayout: CardLayoutItem[] | null;
}) {
  const role = 'adjuster';
  const defs = getCardDefs(role);
  const layout = savedLayout ? mergeLayout(savedLayout, role) : defaultLayout(role);
  const firstName = name.split(' ')[0] ?? name;
  const { activeClaims, todayAppointments, stats } = data;

  const cardContent: Record<string, React.ReactNode> = {
    stats: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Active Assignments" value={String(stats.active)} accent="var(--blue)" />
        <StatCard label="Completed This Week" value={String(stats.completedThisWeek)} accent="var(--sage)" />
        <StatCard label="SLA At-Risk" value={String(stats.slaAtRisk)} accent="var(--orange)" />
      </div>
    ),

    active_claims: (
      <Card>
        <div style={LABEL}>Active Claims</div>
        {activeClaims.length === 0 ? (
          <EmptyState message="No active claims assigned to you yet — check back after dispatch." />
        ) : (
          activeClaims.map((claim) => (
            <a
              key={claim.id}
              href={`/claims/${claim.id}`}
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--white)' }}>{claim.insured}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{claim.number} · {claim.address}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{claim.carrier} · {claim.type}</div>
              </div>
              <Badge tone={STATUS_TONE[claim.status] ?? 'faint'}>{claim.status.replace(/_/g, ' ')}</Badge>
            </a>
          ))
        )}
      </Card>
    ),

    today_schedule: (
      <Card>
        <div style={LABEL}>Today&apos;s Schedule</div>
        {todayAppointments.length === 0 ? (
          <EmptyState message="No inspections scheduled for today — check the Calendar for upcoming appointments." />
        ) : (
          todayAppointments.map((appt) => (
            <a
              key={appt.id}
              href={`/claims/${appt.claimId}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: 'var(--white)', minWidth: '48px' }}>
                {appt.arrivalTime}
              </div>
              <div style={{ flex: 1, fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: 'var(--white)' }}>{appt.insuredName}</div>
                {appt.lossAddress ? <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{appt.lossAddress}</div> : null}
              </div>
              <Badge tone={appt.status === 'confirmed' ? 'sage' : 'orange'}>{appt.status}</Badge>
            </a>
          ))
        )}
      </Card>
    ),
  };

  const header = (
    <div>
      <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>
        {getGreeting()}, {firstName}.
      </h1>
      <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
    </div>
  );

  return <DashboardLayout cardDefs={defs} initialLayout={layout} cardContent={cardContent} header={header} />;
}
