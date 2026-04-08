'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Claim, ClaimStatus, Role } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function toneForStatus(status: Claim['status']) {
  if (status === 'pending_acceptance') return 'bronze';
  if (status === 'approved' || status === 'closed') return 'sage';
  if (status === 'in_review' || status === 'scheduled') return 'orange';
  if (status === 'received' || status === 'on_hold') return 'red';
  return 'blue';
}

const ACCEPT_DECLINE_ROLES = new Set<Role>(['firm_admin', 'super_admin', 'dispatcher']);

export function ClaimRow({
  claim,
  role,
  archivedView = false,
  onRestore,
}: {
  claim: Claim;
  role: Role;
  archivedView?: boolean;
  onRestore?: (claimId: string) => Promise<void>;
}) {
  const router = useRouter();
  const canRestore = archivedView && ['firm_admin', 'super_admin'].includes(role);
  const canAcceptDecline =
    !archivedView && claim.status === 'pending_acceptance' && ACCEPT_DECLINE_ROLES.has(role);

  const [optimisticStatus, setOptimisticStatus] = useState<ClaimStatus | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const displayStatus = optimisticStatus ?? claim.status;

  function flashToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 3000);
  }

  async function patchStatus(body: Record<string, unknown>) {
    const response = await fetch(`/api/claims/${claim.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? 'Request failed.');
    }
  }

  async function handleAccept() {
    setBusy('accept');
    try {
      await patchStatus({ status: 'received' });
      setOptimisticStatus('received');
      flashToast('Claim accepted — ready for dispatch');
      router.refresh();
    } catch (error) {
      flashToast(error instanceof Error ? error.message : 'Unable to accept claim.');
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmDecline() {
    setBusy('decline');
    try {
      await patchStatus({ status: 'closed', declineNote: 'Claim declined by firm.' });
      setOptimisticStatus('closed');
      setDeclineOpen(false);
      flashToast('Claim declined. Carrier has been notified.');
      router.refresh();
    } catch (error) {
      flashToast(error instanceof Error ? error.message : 'Unable to decline claim.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <tr
      style={{ borderBottom: '1px solid var(--border)', cursor: archivedView ? 'default' : 'pointer', opacity: archivedView ? 0.82 : 1 }}
      onClick={() => {
        if (!archivedView) {
          router.push(`/claims/${claim.id}`);
        }
      }}
    >
      <td style={{ padding: '12px 14px', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{claim.number}</td>
      <td style={{ padding: '12px 14px' }}>{claim.insured}</td>
      <td style={{ padding: '12px 14px' }}>{claim.client}</td>
      <td style={{ padding: '12px 14px' }}>{claim.type}</td>
      <td style={{ padding: '12px 14px' }}>{claim.dateOfLoss.slice(0, 10)}</td>
      {role !== 'adjuster' ? <td style={{ padding: '12px 14px' }}>{claim.adjuster ?? 'Unassigned'}</td> : null}
      <td style={{ padding: '12px 14px', color: claim.slaHoursRemaining < 0 ? 'var(--red)' : claim.slaHoursRemaining <= 48 ? 'var(--orange)' : 'var(--white)' }}>{claim.dueDate.slice(0, 10)}</td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Badge tone={toneForStatus(displayStatus)}>{displayStatus.replace(/_/g, ' ')}</Badge>
          {claim.isArchived ? <Badge tone="faint">Archived</Badge> : null}
          {canRestore ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void onRestore?.(claim.id);
              }}
            >
              Restore
            </Button>
          ) : null}
          {canAcceptDecline && displayStatus === 'pending_acceptance' ? (
            <>
              <span onClick={(event) => event.stopPropagation()}>
                <Button
                  size="sm"
                  onClick={() => void handleAccept()}
                  disabled={busy !== null}
                >
                  {busy === 'accept' ? 'Accepting...' : 'Accept'}
                </Button>
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDeclineOpen(true);
                }}
                disabled={busy !== null}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--red)',
                  background: 'transparent',
                  color: 'var(--red)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800,
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: busy !== null ? 'not-allowed' : 'pointer',
                  opacity: busy !== null ? 0.6 : 1,
                }}
              >
                Decline
              </button>
            </>
          ) : null}
        </div>
        {toast ? (
          <div
            onClick={(event) => event.stopPropagation()}
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
        <div onClick={(event) => event.stopPropagation()}>
          <Modal
            open={declineOpen}
            title="Decline this claim?"
            subtitle="This will notify the carrier that you are unable to accept this claim."
            onClose={() => (busy === 'decline' ? undefined : setDeclineOpen(false))}
            footer={
              <>
                <Button variant="ghost" onClick={() => setDeclineOpen(false)} disabled={busy === 'decline'}>
                  Never Mind
                </Button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDecline()}
                  disabled={busy === 'decline'}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--red)',
                    background: 'rgba(224,63,63,0.12)',
                    color: 'var(--red)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 800,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: busy === 'decline' ? 'not-allowed' : 'pointer',
                    opacity: busy === 'decline' ? 0.6 : 1,
                  }}
                >
                  {busy === 'decline' ? 'Declining...' : 'Decline Claim'}
                </button>
              </>
            }
          >
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
              Decline the claim for <strong style={{ color: 'var(--white)' }}>{claim.insured}</strong>? This action cannot be undone from within INSPEKTiQ.
            </p>
          </Modal>
        </div>
      </td>
    </tr>
  );
}
