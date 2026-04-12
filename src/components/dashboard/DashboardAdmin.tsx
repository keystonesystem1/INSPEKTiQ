import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getCardDefs, mergeLayout, defaultLayout } from '@/lib/dashboard-cards';
import type { CardLayoutItem } from '@/lib/dashboard-cards';
import type { Claim } from '@/lib/types';

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

export function DashboardAdmin({
  name,
  firmName,
  stats,
  claims,
  savedLayout,
}: {
  name: string;
  firmName: string;
  stats: { active: number; unassigned: number; newToday: number; slaAtRisk: number };
  claims: Claim[];
  savedLayout: CardLayoutItem[] | null;
}) {
  const role = 'firm_admin';
  const defs = getCardDefs(role);
  const layout = savedLayout ? mergeLayout(savedLayout, role) : defaultLayout(role);

  const greetingName = name.charAt(0).toUpperCase() + name.slice(1);
  const subtitleDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date());

  const unassignedClaims = claims.filter((c) => c.status === 'received');
  const slaRiskClaims = claims.filter((c) => {
    const h = c.slaHoursRemaining;
    return typeof h === 'number' && h >= 0 && h <= 4;
  });

  const cardContent: Record<string, React.ReactNode> = {
    stats: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Active Claims" value={String(stats.active)} accent="var(--blue)" />
        <StatCard label="SLA At-Risk" value={String(stats.slaAtRisk)} accent="var(--orange)" />
        <StatCard label="Unassigned" value={String(stats.unassigned)} accent="var(--orange)" />
        <StatCard label="New Today" value={String(stats.newToday)} accent="var(--sage)" />
      </div>
    ),

    sla_alerts: (
      <Card>
        <div style={LABEL}>SLA Alerts</div>
        {slaRiskClaims.length === 0 ? (
          <EmptyState message="No SLA alerts right now — all claims are within their window." />
        ) : (
          slaRiskClaims.slice(0, 8).map((claim) => (
            <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{claim.insured}</div>
                <div style={{ color: 'var(--orange)', fontSize: '11px' }}>{claim.slaHoursRemaining}h remaining · {claim.number}</div>
              </div>
              <Link href={`/claims/${claim.id}`}>
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </div>
          ))
        )}
      </Card>
    ),

    unassigned: (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', ...LABEL }}>
          <span>Unassigned Claims</span>
          <Link href="/dispatch" style={{ fontWeight: 400, fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: 0, textTransform: 'none' }}>
            Open Dispatch →
          </Link>
        </div>
        {unassignedClaims.length === 0 ? (
          <EmptyState message="No unassigned claims — the queue is clear." />
        ) : (
          unassignedClaims.slice(0, 8).map((claim) => (
            <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{claim.insured}</div>
                <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.address || 'Address unavailable'}</div>
              </div>
              <Link href={`/claims/${claim.id}`}>
                <Button variant="ghost" size="sm">Assign</Button>
              </Link>
            </div>
          ))
        )}
      </Card>
    ),

    activity: (
      <Card>
        <div style={LABEL}>Recent Activity</div>
        {claims.length === 0 ? (
          <EmptyState message="No recent claims — activity will appear here as claims come in." />
        ) : (
          claims.slice(0, 6).map((claim) => (
            <Link
              key={claim.id}
              href={`/claims/${claim.id}`}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{claim.insured}</div>
                <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.number} · {claim.type}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center' }}>{claim.status.replace(/_/g, ' ')}</span>
            </Link>
          ))
        )}
      </Card>
    ),
  };

  const header = (
    <div>
      <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px', letterSpacing: '0.04em' }}>
        {`Good morning, ${greetingName}.`}
      </h1>
      <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
        {`Today, ${subtitleDate} · ${firmName} · Your daily brief is ready.`}
      </p>
    </div>
  );

  return <DashboardLayout cardDefs={defs} initialLayout={layout} cardContent={cardContent} header={header} />;
}
