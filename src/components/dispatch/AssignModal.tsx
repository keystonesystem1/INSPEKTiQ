'use client';

import { useEffect, useMemo, useState } from 'react';
import { OverrideModal } from '@/components/dispatch/OverrideModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { DispatchAdjuster, DispatchClaim } from '@/lib/types';

interface AssignModalProps {
  open: boolean;
  selectedClaims: DispatchClaim[];
  adjusters: DispatchAdjuster[];
  initialAdjusterId?: string | null;
  onClose: () => void;
  onConfirm?: (adjusterId: string, overrideReason?: string) => void | Promise<void>;
}

export interface AssignMismatchIssue {
  kind: 'twia' | 'commercial_license' | 'carrier_approval' | 'max_capacity';
  message: string;
}

export function getMismatchIssues(adjuster: DispatchAdjuster, claims: DispatchClaim[]) {
  const issues = new Map<string, AssignMismatchIssue>();

  if (adjuster.activeClaims >= adjuster.maxClaims) {
    const message = `Adjuster at max capacity (${adjuster.activeClaims}/${adjuster.maxClaims})`;
    issues.set(message, { kind: 'max_capacity', message });
  }

  for (const claim of claims) {
    if (claim.requiresTwia && !adjuster.certifications.includes('TWIA Cert')) {
      const message = `${claim.insuredName} requires TWIA cert — adjuster not certified`;
      issues.set(message, { kind: 'twia', message });
    }

    if (claim.requiredCerts.includes('Commercial Lic') && !adjuster.certifications.includes('Commercial Lic')) {
      const message = `${claim.insuredName} requires Commercial Lic — adjuster doesn't have it`;
      issues.set(message, { kind: 'commercial_license', message });
    }

    if (adjuster.approvedCarriers.length && !adjuster.approvedCarriers.includes(claim.carrier)) {
      const message = `Carrier ${claim.carrier} — adjuster not approved`;
      issues.set(message, { kind: 'carrier_approval', message });
    }
  }

  return Array.from(issues.values());
}

function getAvailabilityLabel(adjuster: DispatchAdjuster) {
  if (adjuster.availability === 'available') return 'Available';
  if (adjuster.availability === 'busy') return 'Busy';
  if (adjuster.availability === 'on_leave') return 'On Leave';
  return 'Remote';
}

function getAvailabilityTone(adjuster: DispatchAdjuster) {
  if (adjuster.availability === 'available') return 'sage';
  if (adjuster.availability === 'busy') return 'orange';
  if (adjuster.availability === 'on_leave') return 'red';
  return 'faint';
}

export function AssignModal({
  open,
  selectedClaims,
  adjusters,
  initialAdjusterId,
  onClose,
  onConfirm,
}: AssignModalProps) {
  const [selectedAdjusterId, setSelectedAdjusterId] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideIssues, setOverrideIssues] = useState<AssignMismatchIssue[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedAdjusterId(initialAdjusterId ?? null);
    setOverrideOpen(false);
    setOverrideIssues([]);
  }, [initialAdjusterId, open]);

  const adjusterCards = useMemo(
    () => adjusters.map((adjuster) => ({ adjuster, issues: getMismatchIssues(adjuster, selectedClaims) })),
    [adjusters, selectedClaims],
  );
  const selectedAdjuster = adjusters.find((adjuster) => adjuster.id === selectedAdjusterId) ?? null;

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(0,0,0,0.65)] px-6">
        <div className="w-[min(540px,92vw)] overflow-hidden rounded-[12px] border border-[var(--border-hi)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-6 py-5">
            <div className="font-['Barlow_Condensed'] text-[18px] font-extrabold tracking-[0.04em] text-[var(--white)]">
              Assign Claims
            </div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">
              {selectedClaims.length} claim{selectedClaims.length === 1 ? '' : 's'} selected
            </div>
          </div>

          <div className="px-6 py-[18px]">
            <div className="mb-2 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Selected Claims
            </div>
            <div className="mb-[14px] max-h-[150px] overflow-y-auto">
              {selectedClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="mb-1 flex items-center gap-[10px] rounded-[5px] bg-[var(--card)] px-[10px] py-[7px] text-[12px] last:mb-0"
                >
                  <div className="grid h-[14px] w-[14px] shrink-0 place-items-center rounded-[3px] bg-[var(--sage)] text-[8px] text-[#06120C]">
                    ✓
                  </div>
                  <div className="min-w-0 flex-1 font-medium text-[var(--white)]">{claim.insuredName}</div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge tone="faint">{claim.lossType}</Badge>
                    {claim.requiredCerts.map((cert) => (
                      <Badge key={`${claim.id}-${cert}`} tone="blue">{cert}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-2 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Assign To
            </div>
            <div className="mb-[14px] grid grid-cols-2 gap-2">
              {adjusterCards.map(({ adjuster, issues }) => {
                const isSelected = selectedAdjusterId === adjuster.id;
                const hasIssues = issues.length > 0;

                return (
                  <button
                    key={adjuster.id}
                    type="button"
                    onClick={() => setSelectedAdjusterId(adjuster.id)}
                    className="relative rounded-[8px] border px-[14px] py-3 text-left transition"
                    style={{
                      borderWidth: '1.5px',
                      borderColor: isSelected
                        ? 'var(--sage)'
                        : hasIssues
                          ? 'rgba(224,123,63,0.3)'
                          : 'var(--border)',
                      background: isSelected ? 'var(--sage-dim)' : 'var(--card)',
                    }}
                  >
                    {hasIssues ? (
                      <div className="absolute right-2 top-2">
                        <Badge tone="orange">⚠ {issues.length} issue{issues.length === 1 ? '' : 's'}</Badge>
                      </div>
                    ) : null}

                    <div className="mb-[5px] flex items-center gap-2">
                      <div
                        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold"
                        style={{
                          borderColor:
                            adjuster.availability === 'available'
                              ? 'var(--sage)'
                              : adjuster.availability === 'busy'
                                ? 'var(--orange)'
                                : 'var(--border-hi)',
                          color:
                            adjuster.availability === 'available'
                              ? 'var(--sage)'
                              : adjuster.availability === 'busy'
                                ? 'var(--orange)'
                                : 'var(--muted)',
                          background:
                            adjuster.availability === 'available'
                              ? 'var(--sage-dim)'
                              : adjuster.availability === 'busy'
                                ? 'var(--orange-dim)'
                                : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {adjuster.initials}
                      </div>
                      <div className="min-w-0 text-[13px] font-medium text-[var(--white)]">{adjuster.name}</div>
                    </div>

                    <div className="mb-1 text-[11px] text-[var(--muted)]">
                      {adjuster.location} · {adjuster.activeClaims}/{adjuster.maxClaims} active
                    </div>

                    <div className="mb-1 flex flex-wrap gap-1">
                      {adjuster.certifications.length ? (
                        adjuster.certifications.map((certification) => (
                          <Badge key={`${adjuster.id}-${certification}`} tone="bronze">{certification}</Badge>
                        ))
                      ) : (
                        <Badge tone="faint">No certs listed</Badge>
                      )}
                    </div>

                    <div className="text-[11px] font-medium">
                      <span
                        style={{
                          color:
                            getAvailabilityTone(adjuster) === 'sage'
                              ? 'var(--sage)'
                              : getAvailabilityTone(adjuster) === 'orange'
                                ? 'var(--orange)'
                                : getAvailabilityTone(adjuster) === 'red'
                                  ? 'var(--red)'
                                  : 'var(--muted)',
                        }}
                      >
                        {getAvailabilityLabel(adjuster)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-[10px] rounded-[6px] bg-[var(--card)] px-[14px] py-[10px] text-[12px] text-[var(--muted)]">
              <span className="text-[14px]">📱</span>
              <span>Adjuster will be notified via email and push notification</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-6 py-[14px]">
            <div className="text-[12px] text-[var(--muted)]">
              {selectedAdjuster ? (
                <>
                  Assigning to: <strong className="text-[var(--sage)]">{selectedAdjuster.name}</strong>
                </>
              ) : (
                'Select an adjuster above'
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!selectedAdjusterId}
                onClick={() => {
                  if (!selectedAdjusterId || !selectedAdjuster) return;
                  const issues = getMismatchIssues(selectedAdjuster, selectedClaims);
                  if (issues.length) {
                    setOverrideIssues(issues);
                    setOverrideOpen(true);
                    return;
                  }
                  void onConfirm?.(selectedAdjusterId);
                }}
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      </div>
      <OverrideModal
        open={overrideOpen}
        adjusterName={selectedAdjuster?.name ?? 'Adjuster'}
        issues={overrideIssues}
        onClose={() => setOverrideOpen(false)}
        onConfirm={(reason) => {
          if (!selectedAdjusterId) return;
          setOverrideOpen(false);
          void onConfirm?.(selectedAdjusterId, reason);
        }}
      />
    </>
  );
}
