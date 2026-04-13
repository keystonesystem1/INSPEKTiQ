'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Claim, ClaimStatus, Role } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// ── Status accent colour ─────────────────────────────────────────────────────

function accentForStatus(status: ClaimStatus): string {
  if (status === 'pending_acceptance') return 'var(--bronze)';
  if (status === 'approved' || status === 'submitted' || status === 'closed') return 'var(--sage)';
  if (status === 'in_review' || status === 'scheduled' || status === 'inspected') return 'var(--orange)';
  if (status === 'received' || status === 'on_hold') return 'var(--red)';
  return 'var(--blue)';
}

function toneForStatus(status: ClaimStatus) {
  if (status === 'pending_acceptance') return 'bronze';
  if (status === 'approved' || status === 'submitted' || status === 'closed') return 'sage';
  if (status === 'in_review' || status === 'scheduled') return 'orange';
  if (status === 'received' || status === 'on_hold') return 'red';
  return 'blue';
}

// ── Actionable SLA urgency ───────────────────────────────────────────────────
// Only surface an SLA signal when the firm can take immediate action.
// Statuses where someone at the firm owns the next move:

const ACTIONABLE_FOR_SLA = new Set<ClaimStatus>(['received', 'in_review', 'approved', 'on_hold']);

function urgencyBadge(hours: number, status: ClaimStatus): { text: string } | null {
  if (!ACTIONABLE_FOR_SLA.has(status)) return null;
  if (hours < 0) {
    const h = Math.abs(hours);
    return { text: h >= 24 ? `Overdue ${Math.floor(h / 24)}d` : `Overdue ${h}h` };
  }
  if (hours <= 24) return { text: `${hours}h left` };
  return null;
}

// ── Reserve formatter ────────────────────────────────────────────────────────

function formatReserve(amount: number): string {
  if (amount === 0) return '$0';
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `$${amount.toLocaleString()}`;
}

// ── Main component ───────────────────────────────────────────────────────────

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
  const urgency = urgencyBadge(claim.slaHoursRemaining, displayStatus);
  const accent = accentForStatus(displayStatus);
  const carrier = claim.carrier || claim.client;
  const location = [claim.address, claim.city, claim.state].filter(Boolean).join(', ');

  function flashToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((c) => (c === message ? null : c)), 3000);
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
      flashToast('Claim declined.');
      router.refresh();
    } catch (error) {
      flashToast(error instanceof Error ? error.message : 'Unable to decline claim.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div
        onClick={() => { if (!archivedView) router.push(`/claims/${claim.id}`); }}
        style={{
          display: 'flex',
          cursor: archivedView ? 'default' : 'pointer',
          opacity: archivedView ? 0.78 : 1,
          borderBottom: '1px solid var(--border)',
          background: 'transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!archivedView) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {/* Status accent bar */}
        <div style={{ width: '3px', flexShrink: 0, background: accent, borderRadius: '0' }} />

        {/* Card body */}
        <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>

          {/* Line 1: Claim # · Insured · Status · SLA + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.06em',
              color: 'var(--sage)',
              flexShrink: 0,
            }}>
              {claim.number || '—'}
            </span>

            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.02em',
              color: 'var(--white)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {claim.insured}
            </span>

            <Badge tone={toneForStatus(displayStatus)}>
              {displayStatus.replace(/_/g, ' ')}
            </Badge>

            {claim.isArchived && <Badge tone="faint">Archived</Badge>}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {urgency && (
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800,
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--red)',
                  background: 'var(--red-dim)',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {urgency.text}
                </span>
              )}

              {canRestore && (
                <span onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => void onRestore?.(claim.id)}>
                    Restore
                  </Button>
                </span>
              )}

              {canAcceptDecline && displayStatus === 'pending_acceptance' && (
                <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '6px' }}>
                  <Button size="sm" onClick={() => void handleAccept()} disabled={busy !== null}>
                    {busy === 'accept' ? 'Accepting…' : 'Accept'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeclineOpen(true)}
                    disabled={busy !== null}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid var(--red)',
                      borderRadius: 'var(--radius-md)',
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
                </span>
              )}
            </div>
          </div>

          {/* Line 2: Carrier · Loss location */}
          <div style={{
            marginTop: '4px',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '12px',
            letterSpacing: '0.03em',
            color: 'var(--muted)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {carrier && (
              <span style={{ color: 'var(--dim)', fontWeight: 600 }}>{carrier}</span>
            )}
            {carrier && location && (
              <span style={{ color: 'var(--faint)', fontSize: '10px' }}>·</span>
            )}
            {location && <span>{location}</span>}
          </div>

          {/* Line 3: DOL · Type · Personnel · Reserve · Counts */}
          <div style={{
            marginTop: '5px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0',
            alignItems: 'center',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '11px',
            color: 'var(--muted)',
            letterSpacing: '0.04em',
          }}>
            {[
              claim.dateOfLoss ? `DOL ${new Date(claim.dateOfLoss).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}` : null,
              claim.type || null,
              claim.adjuster && role !== 'adjuster' ? `FA: ${claim.adjuster}` : null,
              claim.examiner ? `EX: ${claim.examiner}` : null,
              claim.reserveTotal > 0 ? formatReserve(claim.reserveTotal) : '$0',
              claim.photosCount > 0 ? `${claim.photosCount} photo${claim.photosCount !== 1 ? 's' : ''}` : null,
              claim.notesCount > 0 ? `${claim.notesCount} note${claim.notesCount !== 1 ? 's' : ''}` : null,
            ].filter(Boolean).map((item, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <span>{item}</span>
                {i < arr.length - 1 && (
                  <span style={{ margin: '0 6px', color: 'var(--faint)', fontSize: '9px' }}>·</span>
                )}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          padding: '12px 16px', background: 'var(--sage-dim)',
          color: 'var(--sage)', border: '1px solid rgba(91,194,115,0.25)',
          borderRadius: 'var(--radius-md)', fontSize: '13px',
          zIndex: 300, boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
        }}>
          {toast}
        </div>
      )}

      {/* Decline modal */}
      <div onClick={(e) => e.stopPropagation()}>
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
                  padding: '8px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--red)', background: 'rgba(224,63,63,0.12)',
                  color: 'var(--red)', fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: busy === 'decline' ? 'not-allowed' : 'pointer',
                  opacity: busy === 'decline' ? 0.6 : 1,
                }}
              >
                {busy === 'decline' ? 'Declining…' : 'Decline Claim'}
              </button>
            </>
          }
        >
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
            Decline the claim for <strong style={{ color: 'var(--white)' }}>{claim.insured}</strong>? This action cannot be undone from within INSPEKTiQ.
          </p>
        </Modal>
      </div>
    </>
  );
}
