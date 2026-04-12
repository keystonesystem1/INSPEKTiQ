import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

export function DashboardDispatcher() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>Dispatcher Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Unassigned" value="0" accent="var(--orange)" />
        <StatCard label="Scheduled Today" value="0" accent="var(--blue)" />
        <StatCard label="Available Adjusters" value="0" accent="var(--sage)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Unassigned Claims</div>
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No unassigned claims.</div>
        </Card>
        <Card>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Adjuster Availability</div>
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No adjusters available.</div>
        </Card>
      </div>
    </div>
  );
}
