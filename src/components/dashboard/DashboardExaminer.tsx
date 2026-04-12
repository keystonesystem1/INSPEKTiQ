import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getCardDefs, mergeLayout, defaultLayout } from '@/lib/dashboard-cards';
import type { CardLayoutItem } from '@/lib/dashboard-cards';
import type { ExaminerDashboardData } from '@/lib/supabase/dashboard';

const LABEL: React.CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '14px',
};

const STATUS_TONE: Record<string, 'orange' | 'sage' | 'faint'> = {
  in_review: 'orange',
  inspected: 'faint',
  approved: 'sage',
};

function EmptyState({ message }: { message: string }) {
  return <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{message}</p>;
}

export function DashboardExaminer({
  data,
  savedLayout,
}: {
  data: ExaminerDashboardData;
  savedLayout: CardLayoutItem[] | null;
}) {
  const role = 'examiner';
  const defs = getCardDefs(role);
  const layout = savedLayout ? mergeLayout(savedLayout, role) : defaultLayout(role);
  const { reviewQueue, stats } = data;

  const cardContent: Record<string, React.ReactNode> = {
    stats: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Awaiting Review" value={String(stats.awaitingReview)} accent="var(--orange)" />
        <StatCard label="Approved This Week" value={String(stats.approvedThisWeek)} accent="var(--sage)" />
        <StatCard label="Bills Pending" value="0" accent="var(--border-hi)" />
      </div>
    ),

    review_queue: (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...LABEL }}>
          <span>Review Queue</span>
          <a href="/claims" style={{ fontWeight: 400, fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: 0, textTransform: 'none' }}>
            All Claims →
          </a>
        </div>
        {reviewQueue.length === 0 ? (
          <EmptyState message="No claims in the review queue — claims in 'In Review' or 'Inspected' status will appear here." />
        ) : (
          reviewQueue.map((claim) => (
            <a
              key={claim.id}
              href={`/claims/${claim.id}`}
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '13px' }}>{claim.insured}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{claim.number} · {claim.address}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{claim.carrier}</div>
              </div>
              <Badge tone={STATUS_TONE[claim.status] ?? 'faint'}>{claim.status.replace(/_/g, ' ')}</Badge>
            </a>
          ))
        )}
      </Card>
    ),
  };

  const header = (
    <div>
      <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>
        Examiner Dashboard
      </h1>
      <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
    </div>
  );

  return <DashboardLayout cardDefs={defs} initialLayout={layout} cardContent={cardContent} header={header} />;
}
