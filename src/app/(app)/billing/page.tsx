import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { BillingTable } from '@/components/billing/BillingTable';

export default async function BillingPage() {
  const { role } = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin', 'examiner'].includes(role)) {
    redirect('/dashboard');
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <PageHeader
        title="Billing"
        subtitle="Fee schedules, invoices, and examiner review workflow."
      />
      <div
        style={{
          border: '1px solid rgba(224,123,63,0.35)',
          background: 'rgba(224,123,63,0.08)',
          color: 'var(--orange)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Billing module not yet configured — invoice generation and fee schedules are coming in a future release.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Pending Invoices" value="—" accent="var(--orange)" />
        <StatCard label="Approved This Month" value="—" accent="var(--blue)" />
        <StatCard label="Paid YTD" value="—" accent="var(--sage)" />
      </div>
      <BillingTable />
    </div>
  );
}
