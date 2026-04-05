'use client';

import { Button } from '@/components/ui/Button';

export interface LassoFilterState {
  lossTypes: string[];
  claimCategories: string[];
  requiredCertifications: string[];
  carriers: string[];
  maxClaims: number;
}

export function LassoFilters({
  open,
  filters,
  onToggleLossType,
  onToggleClaimCategory,
  onToggleCertification,
  onToggleCarrier,
  onSetMaxClaims,
  onApply,
  onCancel,
  availableCarriers,
}: {
  open: boolean;
  filters: LassoFilterState;
  onToggleLossType: (value: string) => void;
  onToggleClaimCategory: (value: string) => void;
  onToggleCertification: (value: string) => void;
  onToggleCarrier: (value: string) => void;
  onSetMaxClaims: (value: number) => void;
  onApply: () => void;
  onCancel: () => void;
  availableCarriers: string[];
}) {
  if (!open) return null;

  const lossTypes = ['Wind', 'Hail', 'Wind+Hail', 'Fire', 'Flood', 'Liability'];
  const claimCategories = ['Residential', 'Commercial', 'Farm/Ranch', 'Industrial'];
  const certifications = ['TWIA Only', 'Flood Cert', 'Commercial Lic', 'Any'];

  function renderChip(
    label: string,
    active: boolean,
    onClick: () => void,
  ) {
    return (
      <button
        key={label}
        type="button"
        onClick={onClick}
        className={`rounded-[4px] border px-[9px] py-1 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.07em] transition ${
          active
            ? 'border-[var(--sage)] bg-[var(--sage-dim)] text-[var(--sage)]'
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="absolute left-[160px] top-3 z-[200] w-[300px] rounded-[10px] border border-[var(--border-hi)] bg-[var(--card)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
          Lasso Filters
        </div>
        <div className="text-[11px] text-[var(--muted)]">Only matching claims will be grabbable</div>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="mb-2 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Loss Type</div>
        <div className="flex flex-wrap gap-1">
          {lossTypes.map((value) =>
            renderChip(value, filters.lossTypes.includes(value), () => onToggleLossType(value)),
          )}
        </div>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="mb-2 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Claim Category</div>
        <div className="flex flex-wrap gap-1">
          {claimCategories.map((value) =>
            renderChip(value, filters.claimCategories.includes(value), () => onToggleClaimCategory(value)),
          )}
        </div>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="mb-2 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Certifications Required</div>
        <div className="flex flex-wrap gap-1">
          {certifications.map((value) =>
            renderChip(value, filters.requiredCertifications.includes(value), () => onToggleCertification(value)),
          )}
        </div>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="mb-2 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Carrier</div>
        {availableCarriers.length ? (
          <div className="flex flex-wrap gap-1">
            {availableCarriers.map((value) =>
              renderChip(value, filters.carriers.includes(value), () => onToggleCarrier(value)),
            )}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--muted)]">No firm carriers are configured yet.</div>
        )}
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="mb-2 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Max Claims to Select</div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={30}
            value={filters.maxClaims}
            onChange={(event) => onSetMaxClaims(Number(event.target.value))}
            className="flex-1 accent-[var(--sage)]"
          />
          <div className="min-w-7 text-right font-['Barlow_Condensed'] text-sm font-extrabold text-[var(--sage)]">
            {filters.maxClaims}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onApply}>Apply &amp; Draw →</Button>
      </div>
    </div>
  );
}
