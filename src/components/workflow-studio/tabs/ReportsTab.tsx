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

export function ReportsTab({ templates, onChange }: ReportsTabProps) {
  const [activeType, setActiveType] = useState<ReportType>('initial_report');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

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

  const selectedSectionConfig = selectedSection
    ? activeConfig.sections.find((s) => s.sectionKey === selectedSection)
    : null;
  const selectedSectionDef = selectedSection
    ? getSection(selectedSection)
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: '16px', alignItems: 'start' }}>
      {/* Left column: report type list */}
      <div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
          Report Type
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {REPORT_TYPE_LIST.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => { setActiveType(type.key); setSelectedSection(null); }}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                border: 'none',
                background: activeType === type.key ? 'var(--sage-dim)' : 'transparent',
                color: activeType === type.key ? 'var(--sage)' : 'var(--muted)',
                fontWeight: activeType === type.key ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {type.shortLabel}
              {!templates[type.key].enabled && (
                <span style={{ fontSize: '9px', color: 'var(--faint)' }}>OFF</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Enabled
          </span>
          <Toggle checked={activeConfig.enabled} onToggle={() => toggleReportType(!activeConfig.enabled)} />
        </div>
      </div>

      {/* Center: section cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em', color: 'var(--white)' }}>
            {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label} — Section Order
          </div>
          <span style={{ fontSize: '11px', color: 'var(--faint)' }}>
            {activeConfig.sections.filter((s) => s.enabled).length} of {activeConfig.sections.length} enabled
          </span>
        </div>

        {!activeConfig.enabled ? (
          <div style={{ border: '1px dashed var(--border)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>
              Report type disabled
            </div>
            <div style={{ fontSize: '12px', color: 'var(--faint)' }}>
              Enable it from the left panel to configure sections.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeConfig.sections.map((section, index) => {
              const def = SECTION_REGISTRY[section.sectionKey as keyof typeof SECTION_REGISTRY];
              if (!def) return null;
              const isRequired = def.required === true;
              const isSelected = selectedSection === section.sectionKey;

              return (
                <div
                  key={section.sectionKey}
                  onClick={() => setSelectedSection(section.sectionKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    border: isSelected ? '1px solid var(--sage)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--sage-dim)' : 'var(--card)',
                    cursor: 'pointer',
                    opacity: !section.enabled && !isRequired ? 0.5 : 1,
                  }}
                >
                  {/* Drag handle */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px', opacity: 0.3, flexShrink: 0 }}>
                    <span style={{ display: 'block', width: '12px', height: '2px', background: 'var(--white)' }} />
                    <span style={{ display: 'block', width: '12px', height: '2px', background: 'var(--white)' }} />
                    <span style={{ display: 'block', width: '12px', height: '2px', background: 'var(--white)' }} />
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--white)' }}>
                        {section.headingOverride || def.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isRequired && (
                          <span style={{ fontSize: '9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)', background: 'var(--bg)', padding: '2px 6px' }}>
                            Required
                          </span>
                        )}
                        {section.mode && (
                          <span style={{ fontSize: '9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', background: 'var(--surface)', padding: '2px 6px' }}>
                            {MODE_LABELS[section.mode] ?? section.mode}
                          </span>
                        )}
                      </div>
                    </div>
                    {def.label !== (section.headingOverride || def.label) && (
                      <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>
                        Default: {def.label}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {!isRequired && (
                      <Toggle
                        checked={section.enabled}
                        onToggle={() => updateSection(section.sectionKey, { enabled: !section.enabled })}
                      />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <button
                        type="button"
                        disabled={isMoveDisabled(index, 'up', activeConfig.sections)}
                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                        style={{ fontSize: '10px', color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer', opacity: isMoveDisabled(index, 'up', activeConfig.sections) ? 0.2 : 1 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isMoveDisabled(index, 'down', activeConfig.sections)}
                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                        style={{ fontSize: '10px', color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer', opacity: isMoveDisabled(index, 'down', activeConfig.sections) ? 0.2 : 1 }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right column: section settings */}
      <div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
          Section Settings
        </div>

        {!selectedSectionConfig || !selectedSectionDef ? (
          <div style={{ fontSize: '12px', color: 'var(--faint)', padding: '16px 0' }}>
            Select a section to configure it.
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', background: 'var(--card)', padding: '14px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--white)', marginBottom: '14px' }}>
              {selectedSectionDef.label}
            </div>

            {/* Heading override */}
            {selectedSectionDef.supports_heading_override && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  Heading Override
                </span>
                <input
                  type="text"
                  value={selectedSectionConfig.headingOverride ?? ''}
                  placeholder={selectedSectionDef.label}
                  onChange={(e) => updateSection(selectedSection!, { headingOverride: e.target.value || null })}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--white)', fontSize: '12px', outline: 'none' }}
                />
              </div>
            )}

            {/* Mode control */}
            {(() => {
              const modes = getSelectableModes(selectedSection!);
              if (modes.length < 2) return null;
              return (
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                    Mode
                  </span>
                  <div style={{ display: 'flex', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {modes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateSection(selectedSection!, { mode: m as SectionMode })}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: '11px',
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: selectedSectionConfig.mode === m ? 'var(--white)' : 'var(--surface)',
                          color: selectedSectionConfig.mode === m ? 'var(--bg)' : 'var(--muted)',
                          border: 'none',
                          borderRight: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        {MODE_LABELS[m] ?? m}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Field toggles */}
            {selectedSectionDef.supports_field_toggles && selectedSectionDef.v1_field_toggle_scope && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Fields
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedSectionDef.v1_field_toggle_scope.map((fieldKey) => {
                    const on = selectedSectionConfig.fieldToggles?.[fieldKey] ?? true;
                    return (
                      <div key={fieldKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Toggle checked={on} onToggle={() => updateFieldToggle(selectedSection!, fieldKey, !on)} />
                        <span style={{ fontSize: '11px', color: on ? 'var(--white)' : 'var(--faint)', textDecoration: on ? 'none' : 'line-through' }}>
                          {fieldLabel(fieldKey)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subsections */}
            {selectedSectionDef.supports_subsections && selectedSectionConfig.subsections && (
              <div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Subsections
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedSectionConfig.subsections.map((sub) => {
                    const subDef = selectedSectionDef.subsections?.[sub.subsectionKey];
                    if (!subDef) return null;
                    return (
                      <div key={sub.subsectionKey} style={{ padding: '8px 10px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: sub.enabled && subDef.supports_heading_override ? '8px' : '0' }}>
                          <Toggle
                            checked={sub.enabled}
                            onToggle={() => updateSubsection(selectedSection!, sub.subsectionKey, { enabled: !sub.enabled })}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: sub.enabled ? 'var(--white)' : 'var(--faint)' }}>
                            {subDef.label}
                          </span>
                        </div>
                        {sub.enabled && subDef.supports_heading_override && (
                          <input
                            type="text"
                            value={sub.headingOverride ?? ''}
                            placeholder={`Override "${subDef.label}" heading`}
                            onChange={(e) => updateSubsection(selectedSection!, sub.subsectionKey, { headingOverride: e.target.value || null })}
                            style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--white)', fontSize: '11px', outline: 'none', marginLeft: '40px', maxWidth: 'calc(100% - 40px)' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
