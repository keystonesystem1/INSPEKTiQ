'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { WorkflowRow } from '@/lib/supabase/workflows';

type StatusFilter = 'all' | 'active' | 'draft';

interface WorkflowListProps {
  workflows: WorkflowRow[];
}

function deriveStatus(wf: WorkflowRow): 'active' | 'draft' {
  return wf.isDefault ? 'active' : 'draft';
}

function matchSummary(wf: WorkflowRow): string {
  return wf.carrier ?? 'Any carrier';
}

export function WorkflowList({ workflows: initialWorkflows }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>(initialWorkflows);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? workflows
    : workflows.filter((wf) => deriveStatus(wf) === filter);

  const filterButtons: { label: string; value: StatusFilter; count: number }[] = [
    { label: 'All', value: 'all', count: workflows.length },
    { label: 'Active', value: 'active', count: workflows.filter((w) => deriveStatus(w) === 'active').length },
    { label: 'Draft', value: 'draft', count: workflows.filter((w) => deriveStatus(w) === 'draft').length },
  ];

  async function handleDelete(wf: WorkflowRow) {
    if (!window.confirm('Delete this workflow? This cannot be undone.')) return;
    setDeletingId(wf.id);
    try {
      const res = await fetch(`/api/workflows/${wf.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? 'Failed to delete workflow.');
        return;
      }
      setWorkflows((prev) => prev.filter((w) => w.id !== wf.id));
    } catch {
      alert('Failed to delete workflow.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '0.04em', color: 'var(--white)' }}>
            Workflow Studio
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            Manage inspection and report workflow configurations
          </div>
        </div>
        <Link href="/workflow-studio/new">
          <Button size="sm">+ New Workflow</Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          Filter
        </span>
        {filterButtons.map((fb) => (
          <button
            key={fb.value}
            type="button"
            onClick={() => setFilter(fb.value)}
            style={{
              padding: '4px 12px',
              borderRadius: '99px',
              fontSize: '11px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: filter === fb.value ? '1px solid transparent' : '1px solid var(--border)',
              background: filter === fb.value ? 'var(--white)' : 'transparent',
              color: filter === fb.value ? 'var(--bg)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            {fb.label} ({fb.count})
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ border: '1px solid var(--border)', background: 'var(--card)', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--white)', marginBottom: '8px' }}>
            {filter === 'all' ? 'No workflows configured yet' : `No ${filter} workflows`}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            Create your first workflow to start controlling report templates.
          </div>
          <Link href="/workflow-studio/new">
            <Button>+ New Workflow</Button>
          </Link>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', background: 'var(--card)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Workflow Name', 'Status', 'Match Criteria', 'Claim Type', 'Loss Type', 'Property', 'Updated', ''].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--surface)',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((wf) => {
                const status = deriveStatus(wf);
                return (
                  <tr
                    key={wf.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => { window.location.href = `/workflow-studio/${wf.id}`; }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--white)' }}>
                          {wf.name}
                        </span>
                        {wf.isDefault && <Badge tone="sage">Default</Badge>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>
                        {wf.reportTypeCount} report type{wf.reportTypeCount !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge tone={status === 'active' ? 'sage' : 'orange'}>
                        {status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--muted)', maxWidth: '200px' }}>
                      {matchSummary(wf)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--muted)' }}>
                      {wf.claimType ?? 'Any'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--muted)' }}>
                      {wf.lossType ?? 'Any'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--muted)' }}>
                      {wf.propertyType ?? 'Any'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--faint)' }}>
                      {wf.updatedAt}
                    </td>
                    <td
                      style={{ padding: '12px 14px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteButton
                        disabled={deletingId === wf.id}
                        onClick={() => void handleDelete(wf)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeleteButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Delete workflow"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'transparent',
        color: hovered ? 'var(--red)' : 'var(--faint)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'color 0.15s, border-color 0.15s',
        borderColor: hovered ? 'var(--red)' : 'var(--border)',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M1.5 3.5h10M5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M2.5 3.5l.7 7a1 1 0 0 0 1 .93h4.6a1 1 0 0 0 1-.93l.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
