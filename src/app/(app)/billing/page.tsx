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
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '20px', letterSpacing: '0.06em', color: 'var(--white)', marginBottom: '8px' }}>
          Coming Soon
        </div>
        <p style={{ margin: 0, fontSize: '13px' }}>
          Invoice generation, fee schedules, and examiner billing review are in active development.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '12px' }}>
        <StatCard label="Pending Invoices" value="—" accent="var(--orange)" />
        <StatCard label="Approved This Month" value="—" accent="var(--blue)" />
        <StatCard label="Paid YTD" value="—" accent="var(--sage)" />
      </div>
      <BillingTable />
    </div>
  );
}
