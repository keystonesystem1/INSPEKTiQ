'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { defaultWorkflowDraft } from '@/lib/constants/workflowRegistry';
import type { WorkflowDraft } from '@/lib/types/workflow';
import { saveWorkflow } from '@/lib/actions/workflow';
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

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface WorkflowEditorProps {
  initialDraft?: WorkflowDraft;
}

export function WorkflowEditor({ initialDraft }: WorkflowEditorProps = {}) {
  const [workflow, setWorkflow] = useState<WorkflowDraft>(() => initialDraft ?? defaultWorkflowDraft());
  const [activeTab, setActiveTab] = useState<TabId>('reports');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(message: string, type: Toast['type']) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    if (!workflow.id || workflow.id === 'new') {
      showToast('No workflow ID — cannot save', 'error');
      return;
    }

    startTransition(async () => {
      const result = await saveWorkflow(workflow.id, {
        name: workflow.name,
        isDefault: workflow.isDefault,
        templates: workflow.templates,
        matching: workflow.matching,
      });

      if (result.success) {
        showToast('Workflow saved', 'success');
      } else {
        showToast(result.error, 'error');
      }
    });
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
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save Workflow'}
          </Button>
          {toast && (
            <div
              className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-[6px] border px-3 py-2 text-[11px] shadow-lg ${
                toast.type === 'success'
                  ? 'border-[rgba(91,194,115,0.3)] bg-[var(--surface)] text-[var(--sage)]'
                  : 'border-[rgba(255,80,80,0.3)] bg-[var(--surface)] text-[#ff6b6b]'
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar — full bleed */}
      <div className="-mx-10 mt-6 border-b border-[var(--border)] bg-[var(--bg)]">
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
              } ${tab.id === 'overview' || tab.id === 'inspection' || tab.id === 'photos' ? 'opacity-75' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {activeTab === 'overview' && <OverviewTab workflow={workflow} />}
        {activeTab === 'matching' && (
          <MatchingTab
            matching={workflow.matching}
            onChange={(updated) => updateWorkflow({ matching: updated })}
          />
        )}
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
