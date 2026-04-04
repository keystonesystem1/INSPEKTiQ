'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { BillingTable } from '@/components/billing/BillingTable';
import { InvoiceModal } from '@/components/billing/InvoiceModal';

export default function BillingPage() {
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <PageHeader
        title="Billing"
        subtitle="Fee schedules, invoices, and examiner review workflow."
        actions={
          <>
            <Button variant="ghost">Fee Schedules</Button>
            <Button onClick={() => setInvoiceOpen(true)}>New Invoice</Button>
          </>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Pending Invoices" value="7" accent="var(--orange)" />
        <StatCard label="Approved This Month" value="18" accent="var(--blue)" />
        <StatCard label="Paid YTD" value="$218K" accent="var(--sage)" />
      </div>
      <BillingTable />
      <InvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  );
}
