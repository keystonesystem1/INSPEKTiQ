'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { defaultWorkflowDraft } from '@/lib/constants/workflowRegistry';
import type { SectionMode, WorkflowDraft } from '@/lib/types/workflow';
import { OverviewTab } from '@/components/workflow-studio/tabs/OverviewTab';
import { MatchingTab } from '@/components/workflow-studio/tabs/MatchingTab';
import { InspectionTab } from '@/components/workflow-studio/tabs/InspectionTab';
import { PhotosTab } from '@/components/workflow-studio/tabs/PhotosTab';
import { ReportsTab } from '@/components/workflow-studio/tabs/ReportsTab';
import { PreviewTab } from '@/components/workflow-studio/tabs/PreviewTab';

type TabId = 'overview' | 'matching' | 'inspection' | 'photos' | 'reports' | 'preview';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'matching', label: 'Matching' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'photos', label: 'Photos' },
  { id: 'reports', label: 'Reports' },
  { id: 'preview', label: 'Preview' },
];

function getMockDraft(id: string): WorkflowDraft | null {
  const base = defaultWorkflowDraft();

  if (id === '1') {
    return {
      ...base,
      id: '1',
      name: 'Standard Wind & Hail',
      isDefault: true,
      templates: {
        ...base.templates,
        initial_report: {
          ...base.templates.initial_report,
          sections: base.templates.initial_report.sections.map((s) => {
            if (s.sectionKey === 'claim_summary')
              return { ...s, headingOverride: 'Claim Information', mode: 'full' as SectionMode };
            if (s.sectionKey === 'initial_inspection')
              return { ...s, mode: 'narrative' as SectionMode };
            if (s.sectionKey === 'mortgage')
              return { ...s, enabled: false };
            if (s.sectionKey === 'conclusion')
              return { ...s, headingOverride: 'Summary & Recommendations' };
            return s;
          }),
        },
        final_report: {
          ...base.templates.final_report,
          sections: base.templates.final_report.sections.map((s) => {
            if (s.sectionKey === 'risk_description')
              return { ...s, mode: 'narrative' as SectionMode };
            if (s.sectionKey === 'initial_inspection')
              return { ...s, mode: 'narrative' as SectionMode };
            return s;
          }),
        },
        inspection_only: {
          ...base.templates.inspection_only,
          sections: base.templates.inspection_only.sections.map((s) => {
            if (s.sectionKey === 'conclusion') return { ...s, enabled: false };
            if (s.sectionKey === 'enclosures') return { ...s, enabled: false };
            return s;
          }),
        },
      },
    };
  }

  if (id === '2') {
    return {
      ...base,
      id: '2',
      name: 'Commercial Property',
      isDefault: false,
      templates: {
        ...base.templates,
        supplement_report: { ...base.templates.supplement_report, enabled: false },
        inspection_only: { ...base.templates.inspection_only, enabled: false },
        initial_report: {
          ...base.templates.initial_report,
          sections: base.templates.initial_report.sections.map((s) => {
            if (s.sectionKey === 'risk_description')
              return {
                ...s,
                headingOverride: 'Property Risk Assessment',
                mode: 'structured' as SectionMode,
              };
            if (s.sectionKey === 'coverage_c') return { ...s, enabled: false };
            if (s.sectionKey === 'contractors') return { ...s, enabled: false };
            if (s.sectionKey === 'coverage_a')
              return {
                ...s,
                subsections:
                  s.subsections?.map((sub) =>
                    sub.subsectionKey === 'interior'
                      ? { ...sub, headingOverride: 'Interior Assessment' }
                      : sub,
                  ) ?? null,
              };
            return s;
          }),
        },
        final_report: {
          ...base.templates.final_report,
          sections: base.templates.final_report.sections.map((s) => {
            if (s.sectionKey === 'coverage_c') return { ...s, enabled: false };
            if (s.sectionKey === 'contractors') return { ...s, enabled: false };
            return s;
          }),
        },
      },
    };
  }

  return null;
}

interface WorkflowEditorProps {
  workflowId?: string;
}

export function WorkflowEditor({ workflowId }: WorkflowEditorProps = {}) {
  const [workflow, setWorkflow] = useState<WorkflowDraft>(() => {
    if (workflowId) {
      const mock = getMockDraft(workflowId);
      if (mock) return mock;
    }
    return defaultWorkflowDraft();
  });
  const [activeTab, setActiveTab] = useState<TabId>('reports');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  function handleSave() {
    setSaveToast('Persistence available in Phase 2');
    setTimeout(() => setSaveToast(null), 3000);
  }

  function updateWorkflow(updates: Partial<WorkflowDraft>) {
    setWorkflow((prev) => ({ ...prev, ...updates }));
  }

  return (
    <div>
      {/* Back link */}
      <div className="mb-5">
        <Link
          href="/workflow-studio"
          className="font-['Barlow_Condensed'] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] hover:text-[var(--white)]"
        >
          ← Workflow Studio
        </Link>
      </div>

      {/* Header */}
      <div className="mb-2 flex items-center gap-4">
        <input
          type="text"
          value={workflow.name}
          onChange={(e) => updateWorkflow({ name: e.target.value })}
          placeholder="Untitled Workflow"
          className="flex-1 rounded-[6px] border border-[var(--border)] bg-transparent px-3 py-2 font-['Barlow_Condensed'] text-[22px] font-extrabold tracking-[0.04em] text-[var(--white)] placeholder:text-[var(--faint)] focus:border-[var(--border-hi)] focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <span className="font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
            Default
          </span>
          <Toggle
            checked={workflow.isDefault}
            onToggle={() => updateWorkflow({ isDefault: !workflow.isDefault })}
          />
        </div>
        <div className="relative">
          <Button size="sm" onClick={handleSave}>
            Save Workflow
          </Button>
          {saveToast && (
            <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--muted)] shadow-lg">
              {saveToast}
            </div>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <div className="mb-6 font-['Barlow_Condensed'] text-[11px] text-[var(--faint)]">
        Phase 1 — Local state only · Changes are not persisted
      </div>

      {/* Tab bar — full bleed */}
      <div className="-mx-10 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex px-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-5 py-3 font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--sage)] text-[var(--white)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--white)]'
              } ${tab.id === 'reports' || tab.id === 'preview' ? '' : 'opacity-75'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {activeTab === 'overview' && <OverviewTab workflow={workflow} />}
        {activeTab === 'matching' && <MatchingTab matching={workflow.matching} />}
        {activeTab === 'inspection' && <InspectionTab />}
        {activeTab === 'photos' && <PhotosTab />}
        {activeTab === 'reports' && (
          <ReportsTab
            templates={workflow.templates}
            onChange={(updated) => updateWorkflow({ templates: updated })}
          />
        )}
        {activeTab === 'preview' && <PreviewTab templates={workflow.templates} />}
      </div>
    </div>
  );
}
