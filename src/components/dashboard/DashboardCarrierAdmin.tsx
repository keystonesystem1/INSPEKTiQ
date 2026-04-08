'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SubmitClaimModal } from '@/components/carriers/SubmitClaimModal';
import type { Claim } from '@/lib/types';

const ACTIVE_STATUSES = new Set([
  'received',
  'pending_acceptance',
  'assigned',
  'accepted',
  'contacted',
  'scheduled',
  'inspected',
  'in_review',
  'approved',
  'pending_te',
  'on_hold',
]);

export function DashboardCarrierAdmin({
  claims,
  carrierName,
  intakeEmail,
}: {
  claims: Claim[];
  carrierName: string;
  intakeEmail: string | null;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function copyIntakeEmail() {
    if (!intakeEmail) return;
    try {
      await navigator.clipboard.writeText(intakeEmail);
      setToast('Intake email copied to clipboard');
    } catch {
      setToast('Unable to copy');
    }
  }

  const activeCount = claims.filter((claim) => ACTIVE_STATUSES.has(claim.status)).length;
  const recent = [...claims].slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>{carrierName}</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Carrier portal — claims and invoices for your team.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Submit a Claim</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Active Claims" value={String(activeCount)} accent="var(--blue)" />
        <StatCard label="Pending Invoices" value="0" accent="var(--border-hi)" />
        <StatCard label="Total Claims" value={String(claims.length)} accent="var(--sage)" />
      </div>

      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
          Submit via email
        </div>
        {intakeEmail ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: '13px', color: 'var(--white)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {intakeEmail}
            </div>
            <Button size="sm" variant="ghost" onClick={() => void copyIntakeEmail()}>Copy</Button>
          </div>
        ) : (
          <div style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '12px' }}>
            No intake email configured yet. Contact your firm admin to set one up.
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Recent Activity</div>
        {recent.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No claims yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {recent.map((claim) => (
              <div
                key={claim.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--white)' }}>{claim.insured}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{claim.number} · {claim.address}</div>
                </div>
                <Badge tone="blue">{claim.status.replace(/_/g, ' ')}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SubmitClaimModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={(message) => {
          setToast(message);
          router.refresh();
        }}
      />

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 16px',
            background: 'var(--sage-dim)',
            color: 'var(--sage)',
            border: '1px solid rgba(91,194,115,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            zIndex: 300,
            boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
