import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

export function DashboardAdjuster() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>Adjuster Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Active Assignments" value="0" accent="var(--blue)" />
        <StatCard label="Completed This Week" value="0" accent="var(--sage)" />
        <StatCard label="SLA At-Risk" value="0" accent="var(--orange)" />
      </div>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Active Claims</div>
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No active claims.</div>
      </Card>
    </div>
  );
}
