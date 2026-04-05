'use client';

import { useMemo, useState } from 'react';
import { AssignModal } from '@/components/dispatch/AssignModal';
import { Badge } from '@/components/ui/Badge';
import { DispatchMap } from '@/components/dispatch/DispatchMap';
import { LassoFilters, type LassoFilterState } from '@/components/dispatch/LassoFilters';
import { useDispatchData } from '@/hooks/useDispatchData';
import type { DispatchAdjuster, DispatchClaim } from '@/lib/types';

interface DispatchPageProps {
  firmId: string;
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

export function DispatchPage({ firmId }: DispatchPageProps) {
  const { unassignedClaims, assignedActiveClaims, adjusters, carrierOptions, loading, error, refresh } = useDispatchData(firmId);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>('all');
  const [adjusterFilter, setAdjusterFilter] = useState<AdjusterFilter>('all');
  const [lassoFiltersOpen, setLassoFiltersOpen] = useState(false);
  const [lassoActive, setLassoActive] = useState(false);
  const [lassoStartToken, setLassoStartToken] = useState(0);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
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

  const visibleUnassignedClaims = useMemo(
    () => unassignedClaims.filter((claim) => !optimisticRemovedClaimIds.includes(claim.id)),
    [optimisticRemovedClaimIds, unassignedClaims],
  );
  const filteredClaims = useMemo(
    () => visibleUnassignedClaims.filter((claim) => filterClaim(claim, claimFilter)),
    [claimFilter, visibleUnassignedClaims],
  );
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

  function handleSelectClaim(claimId: string) {
    setSelectedClaimIds([claimId]);
  }

  function handleApplyLasso() {
    setLassoFiltersOpen(false);
    setLassoActive(true);
    setLassoStartToken((value) => value + 1);
  }

  function handleClearSelection() {
    setSelectedClaimIds([]);
    setLassoActive(false);
  }

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
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center justify-between gap-3 font-['Barlow_Condensed'] text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
              <span>Unassigned</span>
              <span className="rounded-sm border border-[rgba(224,123,63,0.2)] bg-[var(--orange-dim)] px-2 py-0.5 text-[10px] text-[var(--orange)]">
                {filteredClaims.length}
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
            {loading ? (
              <div className="px-4 py-5 text-[12px] text-[var(--muted)]">Loading dispatch claims...</div>
            ) : error ? (
              <div className="px-4 py-5 text-[12px] text-[var(--red)]">{error}</div>
            ) : filteredClaims.length ? (
              filteredClaims.map((claim) => {
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
            ) : (
              <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No unassigned claims match the current filters.</div>
            )}
          </div>
        </aside>

        <div className="relative min-h-0">
          <DispatchMap
            claims={mapClaims}
            activityClaims={activityClaims}
            adjusters={adjusters}
            selectedClaimIds={selectedClaimIds}
            lassoActive={lassoActive}
            lassoFilters={lassoFilters}
            lassoStartToken={lassoStartToken}
            onOpenLassoFilters={() => setLassoFiltersOpen(true)}
            onSelectClaim={handleSelectClaim}
            onSelectionChange={setSelectedClaimIds}
            onClearSelection={handleClearSelection}
            onFinishLasso={() => setLassoActive(false)}
            onOpenAssignModal={() => setAssignModalOpen(true)}
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
            {loading ? (
              <div className="px-4 py-5 text-[12px] text-[var(--muted)]">Loading adjusters...</div>
            ) : filteredAdjusters.length ? (
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
                      className="rounded-md bg-[var(--sage)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#06120C] shadow-[0_2px_8px_rgba(91,194,115,0.25)]"
                    >
                      Assign
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-[var(--border)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No adjusters match the current filter.</div>
            )}
          </div>
        </aside>
      </div>
      <AssignModal
        open={assignModalOpen}
        selectedClaims={selectedClaims}
        adjusters={adjusters}
        onClose={() => setAssignModalOpen(false)}
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
