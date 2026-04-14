'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import type { Claim, ClaimStatus, Role } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function toneForStatus(status: ClaimStatus) {
  if (status === 'pending_acceptance') return 'bronze';
  if (status === 'approved' || status === 'submitted' || status === 'closed') return 'sage';
  if (status === 'in_review' || status === 'scheduled') return 'orange';
  if (status === 'received' || status === 'on_hold') return 'red';
  return 'blue';
}

function accentColorVar(status: ClaimStatus): string {
  if (status === 'pending_acceptance') return 'var(--bronze)';
  if (status === 'approved' || status === 'submitted' || status === 'closed') return 'var(--sage)';
  if (
    status === 'in_review' ||
    status === 'scheduled' ||
    status === 'inspection_started' ||
    status === 'inspection_completed'
  )
    return 'var(--orange)';
  if (status === 'received' || status === 'on_hold') return 'var(--red)';
  return 'var(--blue)';
}

const FIRM_ACTIONABLE = new Set<ClaimStatus>([
  'received', 'in_review', 'approved', 'on_hold',
]);

function isClaimUrgent(claim: Claim): boolean {
  return FIRM_ACTIONABLE.has(claim.status) && claim.slaHoursRemaining <= 48;
}

const ACCEPT_DECLINE_ROLES = new Set<Role>(['firm_admin', 'super_admin', 'dispatcher']);

/* ---- Shared inline styles ---- */

const fieldRow: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
  fontSize: '13px',
  lineHeight: '1.4',
};

const fieldLabel: CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  flexShrink: 0,
  minWidth: '58px',
};

const fieldValue: CSSProperties = {
  color: 'var(--white)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const linkValue: CSSProperties = {
  ...fieldValue,
  color: 'var(--sage)',
};

const emptyValue: CSSProperties = {
  ...fieldValue,
  color: 'var(--faint)',
};

const section: CSSProperties = {
  padding: '14px 16px',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const sectionLast: CSSProperties = {
  ...section,
  borderRight: 'none',
};

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

  const [hovered, setHovered] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<ClaimStatus | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const displayStatus = optimisticStatus ?? claim.status;
  const urgent = isClaimUrgent(claim);

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

  const dueColor =
    claim.slaHoursRemaining < 0
      ? 'var(--red)'
      : claim.slaHoursRemaining <= 48
        ? 'var(--orange)'
        : 'var(--white)';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        background: hovered && !archivedView ? 'var(--card-hi)' : 'var(--card)',
        borderBottom: '1px solid var(--border)',
        cursor: archivedView ? 'default' : 'pointer',
        opacity: archivedView ? 0.82 : 1,
        transition: 'background 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (!archivedView) router.push(`/claims/${claim.id}`);
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: '3px',
          flexShrink: 0,
          background: accentColorVar(displayStatus),
        }}
      />

      {/* Sections grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 0.75fr 0.75fr',
          minWidth: 0,
        }}
      >
        {/* Section 1: Claim Details (2-column grid) */}
        <div
          style={{
            ...section,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px 16px',
          }}
        >
          <div style={fieldRow}>
            <span style={fieldLabel}>Claim #</span>
            <span
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                color: 'var(--sage)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {claim.number}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>DOL</span>
            <span style={fieldValue}>{claim.dateOfLoss.slice(0, 10)}</span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Type</span>
            <span style={fieldValue}>{claim.type}</span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Carrier</span>
            <span style={linkValue}>{claim.client}</span>
          </div>
          <div style={{ ...fieldRow, gridColumn: '1 / -1' }}>
            <span style={fieldLabel}>Loss Loc</span>
            <span style={linkValue}>
              {claim.address ? `${claim.address}` : ''}
              {claim.city ? `${claim.address ? ', ' : ''}${claim.city}` : ''}
              {claim.state ? `, ${claim.state}` : ''}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Assign</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--white)',
                border: '1px solid var(--border)',
              }}
            >
              {claim.category ?? 'Full Field Inspection'}
            </span>
          </div>
        </div>

        {/* Section 2: People */}
        <div style={section}>
          <div style={fieldRow}>
            <span style={fieldLabel}>INS</span>
            <span style={{ ...fieldValue, color: 'var(--white)' }}>{claim.insured}</span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>EX</span>
            <span style={claim.examiner ? linkValue : emptyValue}>
              {claim.examiner ?? '—'}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>FA</span>
            <span style={claim.adjuster ? linkValue : emptyValue}>
              {claim.adjuster ?? 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Section 3: Activity */}
        <div style={section}>
          <div style={fieldRow}>
            <span style={fieldLabel}>Reserve(s)</span>
            <span style={linkValue}>
              ${claim.reserveTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Contacted</span>
            <span style={fieldValue}>
              {claim.milestones.contacted ? (
                <span style={{ color: 'var(--sage)' }}>
                  {new Date(claim.milestones.contacted).toLocaleDateString()}
                </span>
              ) : (
                <span style={{ color: 'var(--sage)' }}>Contact Activity</span>
              )}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Inspected</span>
            <span style={fieldValue}>
              {claim.milestones.inspection_completed ? (
                <span>{new Date(claim.milestones.inspection_completed).toLocaleDateString()}</span>
              ) : (
                <span style={{ color: 'var(--sage)' }}>Mark Inspected</span>
              )}
            </span>
          </div>
        </div>

        {/* Section 4: Dates */}
        <div style={section}>
          <div style={fieldRow}>
            <span style={fieldLabel}>Rec&apos;d</span>
            <span style={{ fontSize: '13px', color: 'var(--white)' }}>
              {claim.milestones.received
                ? new Date(claim.milestones.received).toLocaleDateString()
                : claim.dateOfLoss.slice(0, 10)}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Due</span>
            <span style={{ fontSize: '13px', color: dueColor }}>
              {claim.dueDate.slice(0, 10)}
            </span>
          </div>
          <div style={fieldRow}>
            <span style={fieldLabel}>Processed</span>
            <span style={{ fontSize: '13px', color: 'var(--white)' }}>
              {claim.milestones.submitted
                ? new Date(claim.milestones.submitted).toLocaleDateString()
                : '—'}
            </span>
          </div>
        </div>

        {/* Section 5: Status */}
        <div
          style={{
            ...sectionLast,
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Badge tone={toneForStatus(displayStatus)}>
            {displayStatus.replace(/_/g, ' ')}
          </Badge>
          {claim.isArchived ? <Badge tone="faint">Archived</Badge> : null}

          {/* Urgency dot */}
          {urgent && !archivedView ? (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background:
                  claim.slaHoursRemaining < 0 ? 'var(--red)' : 'var(--orange)',
                boxShadow:
                  claim.slaHoursRemaining < 0
                    ? '0 0 6px rgba(224,92,92,0.5)'
                    : '0 0 6px rgba(224,123,63,0.4)',
                animation: 'urgency-pulse 1.6s ease-in-out infinite',
              }}
            />
          ) : null}

          {/* Accept/Decline or Restore */}
          {canRestore ? (
            <span onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onRestore?.(claim.id)}
              >
                Restore
              </Button>
            </span>
          ) : null}

          {canAcceptDecline && displayStatus === 'pending_acceptance' ? (
            <div
              style={{ display: 'flex', gap: '6px', marginTop: '4px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                onClick={() => void handleAccept()}
                disabled={busy !== null}
              >
                {busy === 'accept' ? 'Accepting...' : 'Accept'}
              </Button>
              <button
                type="button"
                onClick={() => setDeclineOpen(true)}
                disabled={busy !== null}
                style={{
                  padding: '5px 12px',
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
            </div>
          ) : null}
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          onClick={(e) => e.stopPropagation()}
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

      {/* Decline Modal */}
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
    </div>
  );
}
