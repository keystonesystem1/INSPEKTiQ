'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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

function matchingSummary(wf: WorkflowDraft): string {
  const parts = [
    wf.matching.carrier,
    wf.matching.lossType,
    wf.matching.propertyType,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'No match criteria set';
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
      {/* Editor header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
        <Link
          href="/workflow-studio"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--muted)', padding: '4px 8px',
          }}
        >
          ← Workflows
        </Link>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: workflow.isDefault ? 'var(--sage)' : 'var(--orange)',
              }}
            />
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => updateWorkflow({ name: e.target.value })}
              placeholder="Untitled Workflow"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                fontSize: '18px', letterSpacing: '0.04em', color: 'var(--white)',
                outline: 'none',
              }}
            />
            {workflow.isDefault && <Badge tone="sage">Default</Badge>}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', marginLeft: '15px' }}>
            {matchingSummary(workflow)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Default
            </span>
            <Toggle
              checked={workflow.isDefault}
              onToggle={() => updateWorkflow({ isDefault: !workflow.isDefault })}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            {toast && (
              <div
                style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '8px',
                  whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '11px',
                  border: `1px solid ${toast.type === 'success' ? 'rgba(91,194,115,0.3)' : 'rgba(255,80,80,0.3)'}`,
                  background: 'var(--surface)',
                  color: toast.type === 'success' ? 'var(--sage)' : 'var(--red)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  zIndex: 10,
                }}
              >
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', marginTop: '16px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activeTab === tab.id ? 'var(--white)' : 'var(--muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--sage)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginTop: '24px' }}>
        {activeTab === 'overview' && (
          <OverviewTab workflow={workflow} onUpdate={updateWorkflow} />
        )}
        {activeTab === 'matching' && (
          <MatchingTab
            matching={workflow.matching}
            templates={workflow.templates}
            onChange={(updated) => updateWorkflow({ matching: updated })}
            onTemplatesChange={(updated) => updateWorkflow({ templates: updated })}
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
