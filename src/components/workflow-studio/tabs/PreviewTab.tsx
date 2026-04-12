'use client';

import { useState } from 'react';
import { REPORT_TYPE_LIST, SECTION_REGISTRY, getSection } from '@/lib/constants/workflowRegistry';
import type { ReportType, WorkflowDraft } from '@/lib/types/workflow';

interface PreviewTabProps {
  templates: WorkflowDraft['templates'];
}

const MODE_LABELS: Record<string, string> = {
  summary: 'Summary',
  full: 'Full',
  structured: 'Structured',
  narrative: 'Narrative',
  hybrid: 'Hybrid',
};

export function PreviewTab({ templates }: PreviewTabProps) {
  const [activeType, setActiveType] = useState<ReportType>('initial_report');
  const activeConfig = templates[activeType];
  const enabledSections = activeConfig.sections.filter((s) => s.enabled);

  return (
    <div>
      {/* Notice */}
      <div className="mb-5 flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span className="text-[11px] text-[var(--faint)]">
          Preview Only — This reflects your current configuration. No report data is shown.
        </span>
      </div>

      {/* Report type selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
          Report Type
        </span>
        <div className="flex gap-[2px] rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-[3px]">
          {REPORT_TYPE_LIST.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setActiveType(type.key)}
              className={`rounded-[4px] px-3 py-[5px] font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                activeType === type.key
                  ? 'bg-[var(--sage)] text-[#06120C]'
                  : templates[type.key].enabled
                    ? 'text-[var(--muted)] hover:text-[var(--white)]'
                    : 'text-[var(--faint)] opacity-50 hover:opacity-75'
              }`}
            >
              {type.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Outline */}
      {!activeConfig.enabled ? (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <div className="mb-1 font-['Barlow_Condensed'] text-[13px] font-bold tracking-[0.06em] text-[var(--muted)]">
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label} disabled
          </div>
          <div className="text-[12px] text-[var(--faint)]">
            This workflow does not apply to{' '}
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label.toLowerCase()} reports.
          </div>
        </div>
      ) : enabledSections.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <div className="text-[12px] text-[var(--faint)]">
            No sections enabled. Toggle sections on in the Reports tab.
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-3">
            <div className="font-['Barlow_Condensed'] text-[13px] font-extrabold tracking-[0.06em] text-[var(--white)]">
              {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label}
            </div>
            <div className="mt-[2px] font-['Barlow_Condensed'] text-[10px] text-[var(--faint)]">
              {enabledSections.length} section{enabledSections.length !== 1 ? 's' : ''} · Outline view
            </div>
          </div>

          <ol className="divide-y divide-[var(--border)]">
            {enabledSections.map((section, index) => {
              const def = SECTION_REGISTRY[section.sectionKey as keyof typeof SECTION_REGISTRY];
              if (!def) return null;
              const sectionDef = getSection(section.sectionKey);
              const isRequired = sectionDef?.required === true;
              const enabledSubsections = section.subsections?.filter((s) => s.enabled) ?? [];
              const heading = section.headingOverride || def.label;

              return (
                <li key={section.sectionKey} className="flex gap-4 px-5 py-4">
                  <span className="mt-[1px] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] font-['Barlow_Condensed'] text-[10px] font-bold text-[var(--faint)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-['Barlow_Condensed'] text-[13px] font-bold tracking-[0.04em] text-[var(--white)]">
                        {heading}
                      </span>
                      {section.mode && (
                        <span className="rounded-[3px] bg-[rgba(255,255,255,0.06)] px-1.5 py-[2px] font-['Barlow_Condensed'] text-[9px] uppercase tracking-[0.06em] text-[var(--faint)]">
                          {MODE_LABELS[section.mode] ?? section.mode}
                        </span>
                      )}
                      {isRequired && (
                        <span className="rounded-[3px] bg-[rgba(255,255,255,0.04)] px-1.5 py-[2px] font-['Barlow_Condensed'] text-[9px] uppercase tracking-[0.06em] text-[var(--faint)]">
                          Required
                        </span>
                      )}
                    </div>

                    {/* Subsections */}
                    {enabledSubsections.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {enabledSubsections.map((sub) => {
                          const subDef = def.subsections?.[sub.subsectionKey];
                          if (!subDef) return null;
                          const subHeading = sub.headingOverride || subDef.label;
                          return (
                            <li
                              key={sub.subsectionKey}
                              className="flex items-center gap-2 pl-3"
                            >
                              <span className="h-px w-3 bg-[var(--border)]" />
                              <span className="font-['Barlow_Condensed'] text-[11px] tracking-[0.04em] text-[var(--muted)]">
                                {subHeading}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Field scope summary */}
                    {section.fieldToggles && (
                      <div className="mt-1 text-[10px] text-[var(--faint)]">
                        {Object.values(section.fieldToggles).filter(Boolean).length} of{' '}
                        {Object.keys(section.fieldToggles).length} fields shown
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
