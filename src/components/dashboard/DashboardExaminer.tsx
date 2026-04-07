import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

export function DashboardExaminer() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>Examiner Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Awaiting Review" value="0" accent="var(--orange)" />
        <StatCard label="Approved This Week" value="0" accent="var(--sage)" />
        <StatCard label="Bills Pending" value="0" accent="var(--border-hi)" />
      </div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Review Queue</div>
        </div>
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No claims in review queue.</div>
      </Card>
    </div>
  );
}
