'use client';

import { useCallback, useMemo, useState } from 'react';
import { AssignModal } from '@/components/dispatch/AssignModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DispatchMap } from '@/components/dispatch/DispatchMap';
import { LassoFilters, type LassoFilterState } from '@/components/dispatch/LassoFilters';
import { useDispatchData } from '@/hooks/useDispatchData';
import type { DispatchAdjuster, DispatchClaim } from '@/lib/types';

interface DispatchPageProps {
  firmId: string;
  initialAdjusters: DispatchAdjuster[];
}

type ClaimFilter = 'all' | 'residential' | 'commercial' | 'sla' | 'twia' | 'wind' | 'hail';
type AdjusterFilter = 'all' | 'available' | 'busy';

function getClaimBadgeTone(claim: DispatchClaim) {
  if (claim.status === 'needs_attention') return 'red';
  if (claim.slaDeadlineHours === null) return 'faint';
  if (claim.slaDeadlineHours < 0) return 'red';
  if (claim.slaDeadlineHours <= 24) return 'orange';
  return 'faint';
}

function getClaimBadgeLabel(claim: DispatchClaim) {
  if (claim.status === 'needs_attention') return 'Needs Attention';
  if (claim.slaDeadlineHours === null) return 'OK';
  if (claim.slaDeadlineHours < 0) return 'Overdue';
  if (claim.slaDeadlineHours <= 24) return 'At Risk';
  return 'OK';
}

function getAvailabilityLabel(adjuster: DispatchAdjuster) {
  if (adjuster.availability === 'available') return 'Available';
  if (adjuster.availability === 'busy') return 'Busy';
  if (adjuster.availability === 'on_leave') return 'On Leave';
  return 'Remote';
}

function getCapacityWidth(adjuster: DispatchAdjuster) {
  if (adjuster.maxClaims <= 0) return '0%';
  const percentage = Math.min(100, (adjuster.activeClaims / adjuster.maxClaims) * 100);
  return `${percentage}%`;
}

function filterClaim(claim: DispatchClaim, filter: ClaimFilter) {
  if (filter === 'all') return true;
  if (filter === 'residential') return claim.claimCategory === 'Residential';
  if (filter === 'commercial') return claim.claimCategory === 'Commercial';
  if (filter === 'sla') return claim.status === 'needs_attention' || (claim.slaDeadlineHours !== null && claim.slaDeadlineHours <= 24);
  if (filter === 'twia') return claim.requiresTwia;
  if (filter === 'wind') return claim.lossType.toLowerCase().includes('wind');
  if (filter === 'hail') return claim.lossType.toLowerCase().includes('hail');
  return true;
}

function filterAdjuster(adjuster: DispatchAdjuster, filter: AdjusterFilter) {
  if (filter === 'all') return true;
  return adjuster.availability === filter;
}

export function DispatchPage({ firmId, initialAdjusters }: DispatchPageProps) {
  const {
    unassignedClaims,
    assignedActiveClaims,
    adjusters,
    carrierOptions,
    claimsLoading,
    adjustersLoading,
    loading,
    error,
    claimsError,
    refresh,
  } =
    useDispatchData(firmId, initialAdjusters);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>('all');
  const [adjusterFilter, setAdjusterFilter] = useState<AdjusterFilter>('all');
  const [lassoFiltersOpen, setLassoFiltersOpen] = useState(false);
  const [lassoActive, setLassoActive] = useState(false);
  const [lassoStartToken, setLassoStartToken] = useState(0);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [preferredAdjusterId, setPreferredAdjusterId] = useState<string | null>(null);
  const [optimisticRemovedClaimIds, setOptimisticRemovedClaimIds] = useState<string[]>([]);
  const [optimisticAssignedClaims, setOptimisticAssignedClaims] = useState<DispatchClaim[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lassoFilters, setLassoFilters] = useState<LassoFilterState>({
    lossTypes: ['Wind', 'Hail', 'Wind+Hail', 'Fire', 'Flood', 'Liability'],
    claimCategories: ['Residential', 'Commercial', 'Farm/Ranch', 'Industrial'],
    requiredCertifications: [],
    carriers: [],
    maxClaims: 15,
  });

  const [pendingSectionOpen, setPendingSectionOpen] = useState(true);
  const [declineModal, setDeclineModal] = useState<{ claimId: string; insured: string } | null>(null);
  const [acceptingClaimId, setAcceptingClaimId] = useState<string | null>(null);
  const [decliningClaim, setDecliningClaim] = useState(false);

  const visibleUnassignedClaims = useMemo(
    () => unassignedClaims.filter((claim) => !optimisticRemovedClaimIds.includes(claim.id)),
    [optimisticRemovedClaimIds, unassignedClaims],
  );
  const filteredClaims = useMemo(
    () => visibleUnassignedClaims.filter((claim) => filterClaim(claim, claimFilter)),
    [claimFilter, visibleUnassignedClaims],
  );
  const pendingAcceptanceClaims = useMemo(
    () => filteredClaims.filter((claim) => claim.status === 'pending_acceptance'),
    [filteredClaims],
  );
  const unassignedOnlyClaims = useMemo(
    () => filteredClaims.filter((claim) => claim.status !== 'pending_acceptance'),
    [filteredClaims],
  );

  function flashToast(message: string) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  }

  async function handleAcceptClaim(claimId: string) {
    setAcceptingClaimId(claimId);
    try {
      const response = await fetch(`/api/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'received' }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to accept claim.');
      }
      flashToast('Claim accepted — ready for dispatch');
      await refresh();
    } catch (error) {
      flashToast(error instanceof Error ? error.message : 'Unable to accept claim.');
    } finally {
      setAcceptingClaimId(null);
    }
  }

  async function handleConfirmDecline() {
    if (!declineModal) return;
    setDecliningClaim(true);
    try {
      const response = await fetch(`/api/claims/${declineModal.claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', declineNote: 'Claim declined by firm.' }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to decline claim.');
      }
      setOptimisticRemovedClaimIds((current) => [...new Set([...current, declineModal.claimId])]);
      setDeclineModal(null);
      flashToast('Claim declined. Carrier has been notified.');
      void refresh();
    } catch (error) {
      flashToast(error instanceof Error ? error.message : 'Unable to decline claim.');
    } finally {
      setDecliningClaim(false);
    }
  }
  const mapClaims = useMemo(
    () => {
      const claimsById = new Map<string, DispatchClaim>();
      filteredClaims.forEach((claim) => claimsById.set(claim.id, claim));
      optimisticAssignedClaims.forEach((claim) => claimsById.set(claim.id, claim));
      return Array.from(claimsById.values());
    },
    [filteredClaims, optimisticAssignedClaims],
  );
  const activityClaims = useMemo(
    () => {
      const claimsById = new Map<string, DispatchClaim>();
      assignedActiveClaims.forEach((claim) => claimsById.set(claim.id, claim));
      optimisticAssignedClaims.forEach((claim) => claimsById.set(claim.id, claim));
      return Array.from(claimsById.values());
    },
    [assignedActiveClaims, optimisticAssignedClaims],
  );
  const filteredAdjusters = useMemo(
    () => adjusters.filter((adjuster) => filterAdjuster(adjuster, adjusterFilter)),
    [adjusterFilter, adjusters],
  );
  const selectedClaims = visibleUnassignedClaims.filter((claim) => selectedClaimIds.includes(claim.id));
  const availableAdjusters = adjusters.filter((adjuster) => adjuster.availability === 'available').length;
  function toggleString(list: string[], value: string) {
    return list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
  }

  const handleSelectClaim = useCallback((claimId: string) => {
    setSelectedClaimIds([claimId]);
  }, []);

  const handleOpenLassoFilters = useCallback(() => {
    setLassoFiltersOpen(true);
  }, []);

  function handleApplyLasso() {
    setLassoFiltersOpen(false);
    setLassoActive(true);
    setLassoStartToken((value) => value + 1);
  }

  const handleFinishLasso = useCallback(() => {
    setLassoActive(false);
  }, []);

  const handleOpenAssignModal = useCallback(() => {
    setPreferredAdjusterId(null);
    setAssignModalOpen(true);
  }, []);

  const handleOpenAssignModalForAdjuster = useCallback((adjusterId: string) => {
    setPreferredAdjusterId(adjusterId);
    setAssignModalOpen(true);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedClaimIds([]);
    setLassoActive(false);
  }, []);

  async function handleAssignClaims(adjusterId: string, overrideReason?: string) {
    if (!selectedClaims.length) {
      return;
    }

    try {
      const claimIds = selectedClaims.map((claim) => claim.id);
      const selectedAdjuster = adjusters.find((adjuster) => adjuster.id === adjusterId);
      const assignedAdjusterName = selectedAdjuster?.name ?? 'Adjuster';
      const nextAssignedClaims = selectedClaims.map((claim) => ({
        ...claim,
        status: 'assigned',
        appointmentStatus: null,
      }));

      const response = await fetch('/api/claims/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimIds,
          adjusterId,
          overrideReason,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Failed to assign claims.');
      }

      setOptimisticRemovedClaimIds((current) => [...new Set([...current, ...claimIds])]);
      setOptimisticAssignedClaims((current) => {
        const claimsById = new Map(current.map((claim) => [claim.id, claim]));
        nextAssignedClaims.forEach((claim) => claimsById.set(claim.id, claim));
        return Array.from(claimsById.values());
      });
      setAssignModalOpen(false);
      setSelectedClaimIds([]);
      setLassoActive(false);
      setToastMessage(`✓ ${claimIds.length} claim${claimIds.length === 1 ? '' : 's'} assigned to ${assignedAdjusterName}`);
      setTimeout(() => {
        setToastMessage((current) =>
          current === `✓ ${claimIds.length} claim${claimIds.length === 1 ? '' : 's'} assigned to ${assignedAdjusterName}`
            ? null
            : current,
        );
      }, 3000);

      void refresh().finally(() => {
        setOptimisticRemovedClaimIds((current) => current.filter((claimId) => !claimIds.includes(claimId)));
        setOptimisticAssignedClaims((current) => current.filter((claim) => !claimIds.includes(claim.id)));
      });
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Failed to assign claims.');
      setTimeout(() => {
        setToastMessage((current) =>
          current === (error instanceof Error ? error.message : 'Failed to assign claims.')
            ? null
            : current,
        );
      }, 3000);
    }
  }

  return (
    <div className="-mx-8 -my-7 h-[calc(100vh-var(--nav-h))] overflow-hidden">
      <div className="grid h-full grid-cols-[290px_minmax(0,1fr)_300px] border-y border-[var(--border)] bg-[var(--bg)]">
        <aside className="flex min-h-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
          {pendingAcceptanceClaims.length > 0 ? (
            <div className="border-b border-[var(--border)] bg-[var(--card)]">
              <button
                type="button"
                onClick={() => setPendingSectionOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2 font-['Barlow_Condensed'] text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
                  <span>{pendingSectionOpen ? '▾' : '▸'}</span>
                  <span>Pending Acceptance</span>
                </div>
                <span className="rounded-sm border border-[rgba(193,132,55,0.3)] bg-[rgba(193,132,55,0.15)] px-2 py-0.5 text-[10px] text-[var(--bronze)]">
                  {pendingAcceptanceClaims.length}
                </span>
              </button>
              {pendingSectionOpen ? (
                <div className="border-t border-[var(--border)]">
                  {pendingAcceptanceClaims.map((claim) => (
                    <div key={claim.id} className="border-b border-[var(--border)] px-4 py-3">
                      <div className="mb-1 text-[13px] font-medium text-[var(--white)]">{claim.insuredName}</div>
                      <div className="text-[11px] leading-5 text-[var(--muted)]">
                        {claim.carrier} · {claim.lossType}
                        <br />
                        {claim.lossAddress || 'Address unavailable'}
                        <br />
                        Received {new Date(claim.receivedAt).toLocaleDateString()}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleAcceptClaim(claim.id)}
                          disabled={acceptingClaimId === claim.id}
                        >
                          {acceptingClaimId === claim.id ? 'Accepting...' : 'Accept'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDeclineModal({ claimId: claim.id, insured: claim.insuredName })}
                          className="rounded-md border border-[var(--red)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--red)] hover:bg-[rgba(224,63,63,0.08)]"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center justify-between gap-3 font-['Barlow_Condensed'] text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
              <span>Unassigned</span>
              <span className="rounded-sm border border-[rgba(224,123,63,0.2)] bg-[var(--orange-dim)] px-2 py-0.5 text-[10px] text-[var(--orange)]">
                {unassignedOnlyClaims.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Click to select · Lasso on map to bulk select
            </p>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-3 py-2">
            {[
              ['all', 'All'],
              ['residential', 'Residential'],
              ['commercial', 'Commercial'],
              ['sla', 'SLA Risk'],
              ['twia', 'TWIA'],
              ['wind', 'Wind'],
              ['hail', 'Hail'],
            ].map(([value, label]) => {
              const active = claimFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setClaimFilter(value as ClaimFilter)}
                  className={`rounded-[4px] border px-2 py-1 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.08em] transition ${
                    active
                      ? 'border-[rgba(91,194,115,0.25)] bg-[var(--sage-dim)] text-[var(--sage)]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {claimsLoading && unassignedOnlyClaims.length === 0 ? (
              <div className="px-4 py-5 text-[12px] text-[var(--muted)]">Loading dispatch claims...</div>
            ) : (
              <>
                {claimsError ? (
                  <div className="border-b border-[var(--border)] px-4 py-4">
                    <div className="text-[12px] font-medium text-[var(--red)]">Unable to load unassigned claims</div>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{claimsError}</p>
                    <button
                      type="button"
                      onClick={() => void refresh()}
                      className="mt-3 rounded-md border border-[var(--border)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)] hover:border-[var(--border-hi)]"
                    >
                      Try again
                    </button>
                  </div>
                ) : null}
                {unassignedOnlyClaims.length > 0 ? (
                  unassignedOnlyClaims.map((claim) => {
                    const selected = selectedClaimIds.includes(claim.id);
                    return (
                      <button
                        key={claim.id}
                        type="button"
                        onClick={() => handleSelectClaim(claim.id)}
                        className={`w-full border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--card)] ${
                          selected
                            ? 'border-l-2 border-l-[var(--sage)] bg-[rgba(91,194,115,0.07)]'
                            : 'border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <div className="text-[13px] font-medium text-[var(--white)]">{claim.insuredName}</div>
                          <Badge tone={getClaimBadgeTone(claim)}>{getClaimBadgeLabel(claim)}</Badge>
                        </div>
                        <div className="text-[11px] leading-5 text-[var(--muted)]">
                          {claim.lossAddress || 'Address unavailable'}
                          <br />
                          {claim.carrier} · {claim.lossType}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge tone="faint">{claim.claimCategory}</Badge>
                          {claim.requiresTwia ? <Badge tone="bronze">TWIA</Badge> : null}
                        </div>
                      </button>
                    );
                  })
                ) : !claimsError ? (
                  <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No unassigned claims match the current filters.</div>
                ) : (
                  <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No unassigned claims match the current filters.</div>
                )}
              </>
            )}
          </div>
        </aside>

        <div className="relative h-full min-h-0">
          <DispatchMap
            claims={mapClaims}
            activityClaims={activityClaims}
            adjusters={adjusters}
            selectedClaimIds={selectedClaimIds}
            lassoActive={lassoActive}
            lassoFilters={lassoFilters}
            lassoStartToken={lassoStartToken}
            onOpenLassoFilters={handleOpenLassoFilters}
            onSelectClaim={handleSelectClaim}
            onSelectionChange={setSelectedClaimIds}
            onClearSelection={handleClearSelection}
            onFinishLasso={handleFinishLasso}
            onOpenAssignModal={handleOpenAssignModal}
          />
          <LassoFilters
            open={lassoFiltersOpen}
            filters={{
              ...lassoFilters,
              carriers: lassoFilters.carriers.length ? lassoFilters.carriers : carrierOptions,
            }}
            availableCarriers={carrierOptions}
            onToggleLossType={(value) => setLassoFilters((current) => ({ ...current, lossTypes: toggleString(current.lossTypes, value) }))}
            onToggleClaimCategory={(value) => setLassoFilters((current) => ({ ...current, claimCategories: toggleString(current.claimCategories, value) }))}
            onToggleCertification={(value) => setLassoFilters((current) => ({ ...current, requiredCertifications: toggleString(current.requiredCertifications, value) }))}
            onToggleCarrier={(value) => setLassoFilters((current) => {
              const currentCarriers = current.carriers.length ? current.carriers : carrierOptions;
              return { ...current, carriers: toggleString(currentCarriers, value) };
            })}
            onSetMaxClaims={(value) => setLassoFilters((current) => ({ ...current, maxClaims: value }))}
            onApply={handleApplyLasso}
            onCancel={() => {
              setLassoFiltersOpen(false);
              setLassoActive(false);
            }}
          />
        </div>

        <aside className="flex min-h-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center justify-between gap-3 font-['Barlow_Condensed'] text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
              <span>Adjusters</span>
              <Badge tone="sage">{availableAdjusters} Available</Badge>
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Profiles show capability · Warning on mismatch
            </p>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-3 py-2">
            {[
              ['all', 'All'],
              ['available', 'Available'],
              ['busy', 'Busy'],
            ].map(([value, label]) => {
              const active = adjusterFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAdjusterFilter(value as AdjusterFilter)}
                  className={`rounded-[4px] border px-2 py-1 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.08em] transition ${
                    active
                      ? 'border-[rgba(91,194,115,0.25)] bg-[var(--sage-dim)] text-[var(--sage)]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {adjustersLoading && filteredAdjusters.length === 0 ? (
              <div className="px-4 py-5 text-[12px] text-[var(--muted)]">Loading adjusters...</div>
            ) : (
              <>
                {error ? (
                  <div className="border-b border-[var(--border)] px-4 py-4">
                    <div className="text-[12px] font-medium text-[var(--red)]">Unable to load adjusters or map data</div>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{error}</p>
                    <button
                      type="button"
                      onClick={() => void refresh()}
                      className="mt-3 rounded-md border border-[var(--border)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)] hover:border-[var(--border-hi)]"
                    >
                      Try again
                    </button>
                  </div>
                ) : null}
                {filteredAdjusters.length > 0 ? (
                  filteredAdjusters.map((adjuster) => (
                    <div
                      key={adjuster.id}
                      className="border-b border-[var(--border)] px-4 py-4"
                      style={{
                        borderLeftWidth: '2px',
                        borderLeftStyle: 'solid',
                        borderLeftColor:
                          adjuster.availability === 'available'
                            ? 'var(--sage)'
                            : adjuster.availability === 'busy'
                              ? 'var(--orange)'
                              : 'var(--faint)',
                      }}
                    >
                      <div className="mb-2 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--blue)] bg-[var(--blue-dim)] font-['Barlow_Condensed'] text-xs font-extrabold text-[var(--blue)]">
                          {adjuster.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-[var(--white)]">{adjuster.name}</div>
                          <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                            {adjuster.location} · {getAvailabilityLabel(adjuster)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-1 h-[3px] overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: getCapacityWidth(adjuster),
                            background:
                              adjuster.availability === 'available' ? 'var(--sage)' : 'var(--orange)',
                          }}
                        />
                      </div>
                      <div className="mb-2 font-['Barlow_Condensed'] text-[10px] tracking-[0.06em] text-[var(--faint)]">
                        {adjuster.activeClaims}/{adjuster.maxClaims} active claims
                      </div>

                      <div className="mb-3 flex flex-wrap gap-1">
                        {adjuster.certifications.length ? (
                          adjuster.certifications.map((certification) => (
                            <Badge key={certification} tone="blue">{certification}</Badge>
                          ))
                        ) : (
                          <Badge tone="faint">No certs listed</Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModalForAdjuster(adjuster.id)}
                          disabled={selectedClaims.length === 0}
                          className="rounded-md bg-[var(--sage)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#06120C] shadow-[0_2px_8px_rgba(91,194,115,0.25)]"
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `/adjusters/${adjuster.id}`;
                          }}
                          className="rounded-md border border-[var(--border)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  ))
                ) : !error ? (
                  <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No adjusters match the current filter.</div>
                ) : adjusters.length === 0 ? (
                  <div className="px-4 py-3 text-[12px] text-[var(--muted)]">No adjuster data was loaded yet.</div>
                ) : (
                  <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No adjusters match the current filter.</div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
      <Modal
        open={Boolean(declineModal)}
        title="Decline this claim?"
        subtitle="This will notify the carrier that you are unable to accept this claim."
        onClose={() => (decliningClaim ? undefined : setDeclineModal(null))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclineModal(null)} disabled={decliningClaim}>
              Never Mind
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDecline()}
              disabled={decliningClaim}
              className="rounded-md border border-[var(--red)] bg-[rgba(224,63,63,0.12)] px-4 py-2 font-['Barlow_Condensed'] text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--red)] disabled:opacity-50"
            >
              {decliningClaim ? 'Declining...' : 'Decline Claim'}
            </button>
          </>
        }
      >
        {declineModal ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
            Decline the claim for <strong style={{ color: 'var(--white)' }}>{declineModal.insured}</strong>? This action cannot be undone from within INSPEKTiQ.
          </p>
        ) : null}
      </Modal>
      <AssignModal
        open={assignModalOpen}
        selectedClaims={selectedClaims}
        adjusters={adjusters}
        initialAdjusterId={preferredAdjusterId}
        onClose={() => {
          setAssignModalOpen(false);
          setPreferredAdjusterId(null);
        }}
        onConfirm={handleAssignClaims}
      />
      {toastMessage ? (
        <div className="pointer-events-none fixed left-1/2 top-[66px] z-[999] -translate-x-1/2 rounded-[7px] bg-[var(--sage)] px-[22px] py-[10px] font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#06120C]">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
