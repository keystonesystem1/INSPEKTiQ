'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { SchedulingQueueItem } from '@/lib/types';

type QueueFilter = 'all' | 'sla' | 'residential' | 'commercial';

interface SchedulingQueueProps {
  claims: SchedulingQueueItem[];
  loading: boolean;
  error: string | null;
  onSchedule: (claimId: string) => void;
  onFirstContact: (claimId: string) => Promise<void> | void;
}

function getSlaTone(slaDeadlineHours: number | null) {
  if (slaDeadlineHours === null) return 'faint';
  if (slaDeadlineHours < 0) return 'red';
  if (slaDeadlineHours <= 24) return 'orange';
  return 'faint';
}

function getSlaLabel(slaDeadlineHours: number | null) {
  if (slaDeadlineHours === null) return 'No SLA';
  if (slaDeadlineHours < 0) return 'Overdue';
  if (slaDeadlineHours <= 24) return 'At Risk';
  return `${slaDeadlineHours}h`;
}

export function SchedulingQueue({
  claims,
  loading,
  error,
  onSchedule,
  onFirstContact,
}: SchedulingQueueProps) {
  const [filter, setFilter] = useState<QueueFilter>('all');

  const filteredClaims = useMemo(
    () =>
      claims
        .filter((claim) => {
          if (filter === 'all') return true;
          if (filter === 'sla') {
            return claim.slaDeadlineHours !== null && claim.slaDeadlineHours <= 24;
          }
          if (filter === 'residential') {
            return claim.claimCategory === 'Residential';
          }
          if (filter === 'commercial') {
            return claim.claimCategory === 'Commercial';
          }
          return true;
        })
        .sort((a, b) => {
          const aOverdue = a.slaDeadlineHours !== null && a.slaDeadlineHours < 0 ? 0 : 1;
          const bOverdue = b.slaDeadlineHours !== null && b.slaDeadlineHours < 0 ? 0 : 1;
          if (aOverdue !== bOverdue) return aOverdue - bOverdue;

          const aHours = a.slaDeadlineHours ?? Number.POSITIVE_INFINITY;
          const bHours = b.slaDeadlineHours ?? Number.POSITIVE_INFINITY;
          if (aHours !== bHours) return aHours - bHours;

          return a.receivedAt.localeCompare(b.receivedAt);
        }),
    [claims, filter],
  );

  return (
    <aside className="flex min-h-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-3 font-['Barlow_Condensed'] text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
          <span>Needs Scheduling</span>
          <Badge tone="orange">{filteredClaims.length}</Badge>
        </div>
        <p className="mt-1 text-[11px] text-[var(--muted)]">Sorted by SLA urgency</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-3 py-2">
        {[
          ['all', 'All'],
          ['sla', 'SLA Risk'],
          ['residential', 'Residential'],
          ['commercial', 'Commercial'],
        ].map(([value, label]) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as QueueFilter)}
              className={`rounded-[4px] border px-2 py-1 font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.08em] transition ${
                active
                  ? 'border-[var(--sage)] bg-[var(--sage-dim)] text-[var(--sage)]'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-5 text-[12px] text-[var(--muted)]">Loading scheduling queue...</div>
        ) : error ? (
          <div className="px-4 py-5 text-[12px] text-[var(--red)]">{error}</div>
        ) : filteredClaims.length ? (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', claim.id);
                event.dataTransfer.effectAllowed = 'move';
              }}
              className="cursor-grab border-b border-[var(--border)] px-4 py-3 transition hover:bg-[var(--card)] active:cursor-grabbing"
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-2">
                  <span className="pt-0.5 font-['Barlow_Condensed'] text-[12px] font-bold text-[var(--faint)]">⠿</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[var(--white)]">{claim.insuredName}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">{claim.claimNumber}</div>
                  </div>
                </div>
                <Badge tone={getSlaTone(claim.slaDeadlineHours)}>{getSlaLabel(claim.slaDeadlineHours)}</Badge>
              </div>

              <div className="text-[11px] leading-5 text-[var(--muted)]">
                {claim.lossAddress || 'Address unavailable'}
                <br />
                {claim.carrier} · {claim.lossType}
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onSchedule(claim.id)}>Schedule</Button>
                <Button size="sm" variant="ghost" onClick={() => void onFirstContact(claim.id)}>First Contact</Button>
                <Button size="sm" variant="ghost">···</Button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-5 text-[12px] text-[var(--muted)]">No claims currently need scheduling.</div>
        )}
      </div>
    </aside>
  );
}
