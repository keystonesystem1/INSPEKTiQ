'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface MockWorkflow {
  id: string;
  name: string;
  isDefault: boolean;
  reportTypeCount: number;
  updatedAt: string;
}

const MOCK_WORKFLOWS: MockWorkflow[] = [
  {
    id: '1',
    name: 'Standard Wind & Hail',
    isDefault: true,
    reportTypeCount: 5,
    updatedAt: 'Apr 1, 2026',
  },
  {
    id: '2',
    name: 'Commercial Property',
    isDefault: false,
    reportTypeCount: 3,
    updatedAt: 'Mar 15, 2026',
  },
];

export function WorkflowList() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="font-['Barlow_Condensed'] text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
          {MOCK_WORKFLOWS.length} workflow{MOCK_WORKFLOWS.length !== 1 ? 's' : ''}
        </div>
        <Link href="/workflow-studio/new">
          <Button size="sm">+ New Workflow</Button>
        </Link>
      </div>

      {MOCK_WORKFLOWS.length === 0 ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
          <div className="mb-2 font-['Barlow_Condensed'] text-[16px] font-extrabold tracking-[0.06em] text-[var(--white)]">
            No workflows configured yet
          </div>
          <div className="mb-6 text-[13px] text-[var(--muted)]">
            Create your first workflow to start controlling report templates.
          </div>
          <Link href="/workflow-studio/new">
            <Button>+ New Workflow</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)]">
          {MOCK_WORKFLOWS.map((workflow, index) => (
            <div
              key={workflow.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                index < MOCK_WORKFLOWS.length - 1 ? 'border-b border-[var(--border)]' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-['Barlow_Condensed'] text-[15px] font-extrabold tracking-[0.04em] text-[var(--white)]">
                    {workflow.name}
                  </span>
                  {workflow.isDefault && (
                    <span className="rounded-[4px] bg-[rgba(91,194,115,0.15)] px-2 py-[2px] font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--sage)]">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-1 font-['Barlow_Condensed'] text-[11px] tracking-[0.04em] text-[var(--faint)]">
                  {workflow.reportTypeCount} report type{workflow.reportTypeCount !== 1 ? 's' : ''} · Updated {workflow.updatedAt}
                </div>
              </div>
              <Link href={`/workflow-studio/${workflow.id}`}>
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-[var(--faint)]">
        Phase 1 — Local state only. Persistence available in Phase 2.
      </p>
    </div>
  );
}
