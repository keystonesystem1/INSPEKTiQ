export function InspectionTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-1 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
          Inspection Workflow
        </div>
        <p className="text-[12px] text-[var(--muted)]">
          Control required fields, section visibility, and custom inspection items for adjusters in the field. Changes here affect what adjusters see in INSPEKTiT — not report presentation.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Required Fields', desc: 'Mark fields as required before an adjuster can leave the job site.' },
          { label: 'Section Visibility', desc: 'Show or hide entire inspection sections for specific claim types.' },
          { label: 'Custom Items', desc: 'Add firm-specific checklist items to any inspection section.' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-center"
          >
            <div className="mb-1 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--white)]">
              {item.label}
            </div>
            <p className="text-[11px] text-[var(--faint)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
        <div className="mb-1 font-['Barlow_Condensed'] text-[14px] font-extrabold tracking-[0.06em] text-[var(--white)]">
          Inspection Workflow Customization
        </div>
        <div className="mb-3 text-[12px] text-[var(--muted)]">
          Modify what adjusters see in INSPEKTiT without changing report output.
        </div>
        <span className="rounded-[4px] bg-[var(--bg)] px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
          Configurable in Phase 5
        </span>
      </div>
    </div>
  );
}
