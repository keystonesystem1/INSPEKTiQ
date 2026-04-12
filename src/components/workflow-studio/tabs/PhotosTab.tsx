export function PhotosTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-1 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
          Photo Requirements
        </div>
        <p className="text-[12px] text-[var(--muted)]">
          Configure photo label sets, required photo counts, and organization rules by inspection section. Photo configuration is shared with INSPEKTiT and affects how photos are captured and labeled in the field.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Label Sets', desc: 'Define which photo labels are available per inspection section.' },
          { label: 'Required Counts', desc: 'Set minimum photo requirements for each labeled category.' },
          { label: 'Organization Rules', desc: 'Control photo ordering and grouping in the Photo Report.' },
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
          Photo System Configuration
        </div>
        <div className="mb-3 text-[12px] text-[var(--muted)]">
          Label sets, required counts, and organization rules for the INSPEKTiT photo workflow.
        </div>
        <span className="rounded-[4px] bg-[var(--bg)] px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
          Configurable in a future phase
        </span>
      </div>
    </div>
  );
}
