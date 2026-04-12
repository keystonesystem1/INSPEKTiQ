import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

export function DashboardCarrier() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>Carrier Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Your daily brief.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Open Claims" value="0" accent="var(--blue)" />
        <StatCard label="Reports Ready" value="0" accent="var(--sage)" />
        <StatCard label="Pending Inspection" value="0" accent="var(--border-hi)" />
      </div>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Claim Status</div>
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No claims yet.</div>
      </Card>
    </div>
  );
}
