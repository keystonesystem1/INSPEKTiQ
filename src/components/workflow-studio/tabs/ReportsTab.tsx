'use client';

import { useState } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import {
  REPORT_TYPE_LIST,
  SECTION_REGISTRY,
  getSection,
  getSelectableModes,
} from '@/lib/constants/workflowRegistry';
import type {
  ReportType,
  ReportTypeConfig,
  SectionConfig,
  SectionMode,
  SubsectionConfig,
  WorkflowDraft,
} from '@/lib/types/workflow';

interface ReportsTabProps {
  templates: WorkflowDraft['templates'];
  onChange: (updated: WorkflowDraft['templates']) => void;
}

const MODE_LABELS: Record<string, string> = {
  summary: 'Summary',
  full: 'Full',
  structured: 'Structured',
  narrative: 'Narrative',
  hybrid: 'Hybrid',
};

function fieldLabel(key: string): string {
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function isMoveDisabled(
  index: number,
  direction: 'up' | 'down',
  sections: SectionConfig[],
): boolean {
  const def = getSection(sections[index].sectionKey);
  if (def?.required) return true;
  if (direction === 'up' && index === 0) return true;
  if (direction === 'down') {
    const nextIndex = index + 1;
    if (nextIndex >= sections.length) return true;
    const nextDef = getSection(sections[nextIndex].sectionKey);
    if (nextDef?.required) return true;
  }
  return false;
}

function isSectionExpandable(sectionKey: string): boolean {
  const def = getSection(sectionKey);
  if (!def || def.required) return false;
  const hasModes = getSelectableModes(sectionKey).length > 0;
  const hasFieldToggles =
    def.supports_field_toggles && (def.v1_field_toggle_scope?.length ?? 0) > 0;
  const hasSubsections =
    def.supports_subsections && Object.keys(def.subsections ?? {}).length > 0;
  return def.supports_heading_override || hasModes || hasFieldToggles || hasSubsections;
}

export function ReportsTab({ templates, onChange }: ReportsTabProps) {
  const [activeType, setActiveType] = useState<ReportType>('initial_report');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const activeConfig = templates[activeType];

  function updateTemplates(updatedConfig: ReportTypeConfig) {
    onChange({ ...templates, [activeType]: updatedConfig });
  }

  function toggleReportType(enabled: boolean) {
    updateTemplates({ ...activeConfig, enabled });
  }

  function updateSection(sectionKey: string, updates: Partial<SectionConfig>) {
    updateTemplates({
      ...activeConfig,
      sections: activeConfig.sections.map((s) =>
        s.sectionKey === sectionKey ? { ...s, ...updates } : s,
      ),
    });
  }

  function moveSection(index: number, direction: 'up' | 'down') {
    const sections = [...activeConfig.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    updateTemplates({ ...activeConfig, sections });
  }

  function updateSubsection(
    sectionKey: string,
    subsectionKey: string,
    updates: Partial<SubsectionConfig>,
  ) {
    const section = activeConfig.sections.find((s) => s.sectionKey === sectionKey);
    if (!section?.subsections) return;
    updateSection(sectionKey, {
      subsections: section.subsections.map((sub) =>
        sub.subsectionKey === subsectionKey ? { ...sub, ...updates } : sub,
      ),
    });
  }

  function updateFieldToggle(sectionKey: string, fieldKey: string, enabled: boolean) {
    const section = activeConfig.sections.find((s) => s.sectionKey === sectionKey);
    updateSection(sectionKey, {
      fieldToggles: { ...(section?.fieldToggles ?? {}), [fieldKey]: enabled },
    });
  }

  return (
    <div>
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

      {/* Report type enable/disable */}
      <div className="mb-5 flex items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div>
          <div className="font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--white)]">
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label}
          </div>
          <div className="mt-[2px] text-[11px] text-[var(--faint)]">
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.description}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-['Barlow_Condensed'] text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {activeConfig.enabled ? 'Active' : 'Disabled'}
          </span>
          <Toggle checked={activeConfig.enabled} onToggle={() => toggleReportType(!activeConfig.enabled)} />
        </div>
      </div>

      {/* Section list */}
      {activeConfig.enabled ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2">
            <span className="font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
              Report Sections
            </span>
            <span className="font-['Barlow_Condensed'] text-[10px] text-[var(--faint)]">·</span>
            <span className="font-['Barlow_Condensed'] text-[10px] text-[var(--faint)]">
              {activeConfig.sections.filter((s) => s.enabled).length} of {activeConfig.sections.length} enabled
            </span>
          </div>

          {activeConfig.sections.map((section, index) => {
            const def = SECTION_REGISTRY[section.sectionKey as keyof typeof SECTION_REGISTRY];
            if (!def) return null;
            const selectableModes = getSelectableModes(section.sectionKey);
            const isRequired = def.required === true;
            const expandable = isSectionExpandable(section.sectionKey);
            const isExpanded = expandedSection === section.sectionKey;
            const showModeControl = selectableModes.length >= 2;

            return (
              <div
                key={section.sectionKey}
                className={`border-b border-[var(--border)] last:border-b-0 ${
                  !section.enabled && !isRequired ? 'opacity-60' : ''
                }`}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Move controls */}
                  <div className="flex flex-col gap-[1px]">
                    <button
                      type="button"
                      disabled={isMoveDisabled(index, 'up', activeConfig.sections)}
                      onClick={() => moveSection(index, 'up')}
                      className="flex h-4 w-4 items-center justify-center rounded-[3px] text-[10px] text-[var(--faint)] disabled:opacity-20 hover:not-disabled:text-[var(--muted)]"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={isMoveDisabled(index, 'down', activeConfig.sections)}
                      onClick={() => moveSection(index, 'down')}
                      className="flex h-4 w-4 items-center justify-center rounded-[3px] text-[10px] text-[var(--faint)] disabled:opacity-20 hover:not-disabled:text-[var(--muted)]"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Toggle or lock */}
                  {isRequired ? (
                    <div className="flex h-[18px] w-[32px] items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--bg)]">
                      <span className="text-[9px] text-[var(--faint)]">🔒</span>
                    </div>
                  ) : (
                    <Toggle
                      checked={section.enabled}
                      onToggle={() => updateSection(section.sectionKey, { enabled: !section.enabled })}
                    />
                  )}

                  {/* Label */}
                  <div className="min-w-0 flex-1">
                    <span className="font-['Barlow_Condensed'] text-[13px] font-bold tracking-[0.04em] text-[var(--white)]">
                      {section.headingOverride || def.label}
                    </span>
                    {section.headingOverride && (
                      <span className="ml-2 text-[10px] text-[var(--faint)]">
                        (overrides: {def.label})
                      </span>
                    )}
                    {isRequired && (
                      <span className="ml-2 rounded-[3px] bg-[var(--bg)] px-1.5 py-[1px] font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
                        Required
                      </span>
                    )}
                    {section.mode && (
                      <span className="ml-2 rounded-[3px] bg-[var(--bg)] px-1.5 py-[1px] font-['Barlow_Condensed'] text-[9px] uppercase tracking-[0.06em] text-[var(--faint)]">
                        {MODE_LABELS[section.mode] ?? section.mode}
                      </span>
                    )}
                  </div>

                  {/* Expand chevron */}
                  {expandable && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSection(isExpanded ? null : section.sectionKey)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[10px] text-[var(--muted)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--white)]"
                    >
                      {isExpanded ? '▼' : '›'}
                    </button>
                  )}
                </div>

                {/* Expanded content */}
                {expandable && isExpanded && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 pb-5 pt-4">
                    <div className="space-y-4 pl-[52px]">
                      {/* Heading override */}
                      {def.supports_heading_override && (
                        <div>
                          <label className="mb-1 block font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
                            Heading Override
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={section.headingOverride ?? ''}
                              placeholder={def.label}
                              onChange={(e) =>
                                updateSection(section.sectionKey, {
                                  headingOverride: e.target.value || null,
                                })
                              }
                              className="flex-1 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--white)] placeholder:text-[var(--faint)] focus:border-[var(--border-hi)] focus:outline-none"
                            />
                            {section.headingOverride && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateSection(section.sectionKey, { headingOverride: null })
                                }
                                className="rounded-[6px] border border-[var(--border)] px-3 py-2 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mode control */}
                      {showModeControl && (
                        <div>
                          <label className="mb-2 block font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
                            Mode
                          </label>
                          <div className="flex gap-[2px] rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-[2px] w-fit">
                            {selectableModes.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() =>
                                  updateSection(section.sectionKey, { mode: m as SectionMode })
                                }
                                className={`rounded-[4px] px-3 py-[5px] font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.06em] transition-colors ${
                                  section.mode === m
                                    ? 'bg-[var(--bg)] text-[var(--white)]'
                                    : 'text-[var(--faint)] hover:text-[var(--muted)]'
                                }`}
                              >
                                {MODE_LABELS[m] ?? m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Field toggles */}
                      {def.supports_field_toggles && def.v1_field_toggle_scope && (
                        <div>
                          <label className="mb-2 block font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
                            Fields
                          </label>
                          <div className="grid grid-cols-2 gap-y-2">
                            {def.v1_field_toggle_scope.map((fieldKey) => {
                              const on = section.fieldToggles?.[fieldKey] ?? true;
                              return (
                                <div key={fieldKey} className="flex items-center gap-2">
                                  <Toggle
                                    checked={on}
                                    onToggle={() =>
                                      updateFieldToggle(section.sectionKey, fieldKey, !on)
                                    }
                                  />
                                  <span
                                    className={`font-['Barlow_Condensed'] text-[11px] tracking-[0.04em] ${
                                      on ? 'text-[var(--muted)]' : 'text-[var(--faint)] line-through'
                                    }`}
                                  >
                                    {fieldLabel(fieldKey)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Subsections (V1: Coverage A only) */}
                      {def.supports_subsections && section.subsections && (
                        <div>
                          <label className="mb-2 block font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
                            Subsections
                          </label>
                          <div className="space-y-3">
                            {section.subsections.map((sub) => {
                              const subDef = def.subsections?.[sub.subsectionKey];
                              if (!subDef) return null;
                              return (
                                <div
                                  key={sub.subsectionKey}
                                  className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3"
                                >
                                  <div className="mb-2 flex items-center gap-2">
                                    <Toggle
                                      checked={sub.enabled}
                                      onToggle={() =>
                                        updateSubsection(section.sectionKey, sub.subsectionKey, {
                                          enabled: !sub.enabled,
                                        })
                                      }
                                    />
                                    <span
                                      className={`font-['Barlow_Condensed'] text-[12px] font-bold tracking-[0.04em] ${
                                        sub.enabled ? 'text-[var(--white)]' : 'text-[var(--faint)]'
                                      }`}
                                    >
                                      {subDef.label}
                                    </span>
                                  </div>
                                  {sub.enabled && subDef.supports_heading_override && (
                                    <div className="flex gap-2 pl-[42px]">
                                      <input
                                        type="text"
                                        value={sub.headingOverride ?? ''}
                                        placeholder={`Override "${subDef.label}" heading`}
                                        onChange={(e) =>
                                          updateSubsection(
                                            section.sectionKey,
                                            sub.subsectionKey,
                                            { headingOverride: e.target.value || null },
                                          )
                                        }
                                        className="flex-1 rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[11px] text-[var(--white)] placeholder:text-[var(--faint)] focus:border-[var(--border-hi)] focus:outline-none"
                                      />
                                      {sub.headingOverride && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateSubsection(
                                              section.sectionKey,
                                              sub.subsectionKey,
                                              { headingOverride: null },
                                            )
                                          }
                                          className="rounded-[5px] border border-[var(--border)] px-2 py-1 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--faint)] hover:text-[var(--muted)]"
                                        >
                                          Clear
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <div className="mb-1 font-['Barlow_Condensed'] text-[13px] font-bold tracking-[0.06em] text-[var(--muted)]">
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label} disabled
          </div>
          <div className="text-[12px] text-[var(--faint)]">
            This workflow does not apply to{' '}
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label.toLowerCase()} reports.
          </div>
        </div>
      )}
    </div>
  );
}
