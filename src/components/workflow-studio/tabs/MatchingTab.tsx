import type { MatchingRuleShell } from '@/lib/types/workflow';

interface MatchingTabProps {
  matching: MatchingRuleShell;
}

const MATCHING_FIELDS: { key: keyof MatchingRuleShell; label: string; placeholder: string }[] = [
  { key: 'carrier', label: 'Carrier', placeholder: 'e.g. State Farm, Allstate' },
  { key: 'claimType', label: 'Claim Type', placeholder: 'e.g. Residential, Commercial' },
  { key: 'lossType', label: 'Loss Type', placeholder: 'e.g. Wind, Hail, Fire' },
  { key: 'propertyType', label: 'Property Type', placeholder: 'e.g. Single Family, Multi-Family' },
];

export function MatchingTab({ matching }: MatchingTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-1 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
          Matching Dimensions
        </div>
        <p className="mb-5 text-[12px] text-[var(--muted)]">
          When a claim is created, INSPEKTiQ will score all active workflows against these dimensions and select the best match. Falls back to the default workflow.
        </p>

        <div className="space-y-4">
          {MATCHING_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                {field.label}
              </label>
              <input
                type="text"
                disabled
                placeholder={matching[field.key] ?? field.placeholder}
                className="w-full cursor-not-allowed rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--faint)] placeholder:text-[var(--faint)] opacity-60"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
        <div className="mb-1 font-['Barlow_Condensed'] text-[14px] font-extrabold tracking-[0.06em] text-[var(--white)]">
          Matching Rules
        </div>
        <div className="mb-3 text-[12px] text-[var(--muted)]">
          Score-based matching with fallback to firm default. Dimensions: Carrier · Claim Type · Loss Type · Property Type.
        </div>
        <span className="rounded-[4px] bg-[var(--bg)] px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
          Configurable in Phase 3
        </span>
      </div>
    </div>
  );
}
