import type { MatchingRuleShell } from '@/lib/types/workflow';

interface MatchingTabProps {
  matching: MatchingRuleShell;
  onChange: (updated: MatchingRuleShell) => void;
}

// Canonical values must match INSPEKTiT exact-match logic exactly.
// Source: inspektit-app/src/hooks/useWorkflowTemplate.js + parseAssignmentEmail.js

// claimType → compared against claims.policy_type (Title Case, stored as-is)
const CLAIM_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Residential',  value: 'Residential' },
  { label: 'Commercial',   value: 'Commercial' },
  { label: 'Farm/Ranch',   value: 'Farm/Ranch' },
  { label: 'Industrial',   value: 'Industrial' },
];

// lossType → compared against claims.loss_type
// Canonical set from INSPEKTiT parseAssignmentEmail normalizer.
// NOTE: slash not plus — 'Wind/Hail', not 'Wind+Hail'
const LOSS_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Wind',          value: 'Wind' },
  { label: 'Hail',          value: 'Hail' },
  { label: 'Wind / Hail',   value: 'Wind/Hail' },
  { label: 'Water',         value: 'Water' },
  { label: 'Fire',          value: 'Fire' },
  { label: 'Lightning',     value: 'Lightning' },
  { label: 'Theft',         value: 'Theft' },
  { label: 'Vandalism',     value: 'Vandalism' },
];

// propertyType → compared against inspectionData.interview.propertyType
// Source: ClaimDetail.jsx property type picker in INSPEKTiT
const PROPERTY_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Single Family', value: 'Single Family' },
  { label: 'Multi-Family',  value: 'Multi-Family' },
  { label: 'Condo',         value: 'Condo' },
  { label: 'Townhome',      value: 'Townhome' },
  { label: 'Mobile Home',   value: 'Mobile Home' },
  { label: 'Commercial',    value: 'Commercial' },
];

const inputClass =
  "w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--white)] placeholder:text-[var(--faint)] focus:border-[var(--border-hi)] focus:outline-none";
// inputClass kept for the Carrier free-text field

const selectClass =
  "w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--white)] focus:border-[var(--border-hi)] focus:outline-none";

const labelClass =
  "mb-1 block font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]";

export function MatchingTab({ matching, onChange }: MatchingTabProps) {
  function set(field: keyof MatchingRuleShell, value: string) {
    onChange({ ...matching, [field]: value.trim() || null });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-1 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
          Matching Dimensions
        </div>
        <p className="mb-1 text-[12px] text-[var(--muted)]">
          When a claim is created, INSPEKTiQ scores all active workflows against these dimensions and selects the best match. Falls back to the default workflow.
        </p>
        <p className="mb-6 text-[11px] text-[var(--faint)]">
          Leave a field blank to match all values.
        </p>

        <div className="space-y-5">
          {/* Carrier — free text */}
          <div>
            <label className={labelClass}>Carrier</label>
            <input
              type="text"
              value={matching.carrier ?? ''}
              onChange={(e) => set('carrier', e.target.value)}
              placeholder="Any carrier"
              className={inputClass}
            />
          </div>

          {/* Claim Type — select */}
          <div>
            <label className={labelClass}>Claim Type</label>
            <select
              value={matching.claimType ?? ''}
              onChange={(e) => set('claimType', e.target.value)}
              className={selectClass}
            >
              <option value="">Any claim type</option>
              {CLAIM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Loss Type — select */}
          <div>
            <label className={labelClass}>Loss Type</label>
            <select
              value={matching.lossType ?? ''}
              onChange={(e) => set('lossType', e.target.value)}
              className={selectClass}
            >
              <option value="">Any loss type</option>
              {LOSS_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Property Type — select (values from INSPEKTiT inspection form) */}
          <div>
            <label className={labelClass}>Property Type</label>
            <select
              value={matching.propertyType ?? ''}
              onChange={(e) => set('propertyType', e.target.value)}
              className={selectClass}
            >
              <option value="">Any property type</option>
              {PROPERTY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
