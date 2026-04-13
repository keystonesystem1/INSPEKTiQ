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
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      {/* Main preview */}
      <div style={{ flex: 1, maxWidth: '640px' }}>
        {/* Report type selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Preview report type:</span>
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as ReportType)}
            style={{ fontSize: '13px', padding: '6px 10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--white)', outline: 'none' }}
          >
            {REPORT_TYPE_LIST.filter((t) => templates[t.key].enabled).map((type) => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Document preview */}
        {!activeConfig.enabled ? (
          <div style={{ border: '1px dashed var(--border)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--muted)' }}>
              {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label} disabled
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', background: 'var(--card)', overflow: 'hidden' }}>
            {/* Document header */}
            <div style={{ background: 'var(--white)', color: 'var(--bg)', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.04em' }}>
                  {REPORT_TYPE_LIST.find((t) => t.key === activeType)?.label}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                  {enabledSections.length} section{enabledSections.length !== 1 ? 's' : ''} · Preview
                </div>
              </div>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.5 }}>
                INSPEKTiQ
              </span>
            </div>

            {/* Sections */}
            {enabledSections.map((section, index) => {
              const def = SECTION_REGISTRY[section.sectionKey as keyof typeof SECTION_REGISTRY];
              if (!def) return null;
              const sectionDef = getSection(section.sectionKey);
              const isRequired = sectionDef?.required === true;
              const enabledSubsections = section.subsections?.filter((s) => s.enabled) ?? [];

              return (
                <div key={section.sectionKey} style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--sage-dim)', color: 'var(--sage)',
                    fontSize: '11px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--white)' }}>
                        {section.headingOverride || def.label}
                      </span>
                      {section.mode && (
                        <span style={{ fontSize: '9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)', background: 'var(--surface)', padding: '2px 6px' }}>
                          {MODE_LABELS[section.mode] ?? section.mode}
                        </span>
                      )}
                      {isRequired && (
                        <span style={{ fontSize: '9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faint)', background: 'var(--bg)', padding: '2px 6px' }}>
                          Required
                        </span>
                      )}
                    </div>

                    {enabledSubsections.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {enabledSubsections.map((sub) => {
                          const subDef = def.subsections?.[sub.subsectionKey];
                          if (!subDef) return null;
                          return (
                            <div key={sub.subsectionKey} style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '12px' }}>
                              <span style={{ width: '12px', height: '1px', background: 'var(--border)' }} />
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                {sub.headingOverride || subDef.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {section.fieldToggles && (
                      <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--faint)' }}>
                        {Object.values(section.fieldToggles).filter(Boolean).length} of{' '}
                        {Object.keys(section.fieldToggles).length} fields shown
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: legend */}
      <div style={{ flex: '0 0 220px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
          Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--sage)', flexShrink: 0 }} />
            <span style={{ color: 'var(--dim)' }}>Enabled section</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
            <span style={{ color: 'var(--dim)' }}>Disabled section</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
            <span style={{ color: 'var(--dim)' }}>AI-generated section</span>
          </div>
        </div>
        <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0' }} />
        <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
          This preview shows section order only. Actual content is generated at report creation time.
        </div>
      </div>
    </div>
  );
}
