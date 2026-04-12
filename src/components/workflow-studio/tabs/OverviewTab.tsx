import type { WorkflowDraft } from '@/lib/types/workflow';

interface OverviewTabProps {
  workflow: WorkflowDraft;
}

export function OverviewTab({ workflow }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
          Workflow Summary
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--muted)]">Name</span>
            <span className="font-['Barlow_Condensed'] text-[13px] font-bold tracking-[0.04em] text-[var(--white)]">
              {workflow.name || 'Untitled Workflow'}
            </span>
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--muted)]">Default Workflow</span>
            <span
              className={`rounded-[4px] px-2 py-[2px] font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${
                workflow.isDefault
                  ? 'bg-[rgba(91,194,115,0.15)] text-[var(--sage)]'
                  : 'bg-[var(--bg)] text-[var(--faint)]'
              }`}
            >
              {workflow.isDefault ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--muted)]">Report Types Configured</span>
            <span className="font-['Barlow_Condensed'] text-[13px] font-bold tracking-[0.04em] text-[var(--white)]">
              {Object.values(workflow.templates).filter((t) => t.enabled).length} / 5
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
        <div className="mb-1 font-['Barlow_Condensed'] text-[14px] font-extrabold tracking-[0.06em] text-[var(--white)]">
          Overview
        </div>
        <div className="mb-3 text-[12px] text-[var(--muted)]">
          General workflow settings — name, default status, and carrier assignment.
        </div>
        <span className="rounded-[4px] bg-[var(--bg)] px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
          Full controls in Phase 2
        </span>
      </div>
    </div>
  );
}
