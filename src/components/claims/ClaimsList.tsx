'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClaimsFilters } from '@/components/claims/ClaimsFilters';
import { ClaimRow } from '@/components/claims/ClaimRow';
import type { Claim, ClaimStatus, Role } from '@/lib/types';

const claimFilters: Array<{ label: string; value: ClaimStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Received', value: 'received' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Inspection completed', value: 'inspection_completed' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Closed', value: 'closed' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Pending T&E', value: 'pending_te' },
  { label: 'Pending Carrier Direction', value: 'pending_carrier_direction' },
  { label: 'Pending Engineer', value: 'pending_engineer' },
];

export function ClaimsList({
  role,
  claims,
  archivedView = false,
  carrierFilter,
  searchQuery,
}: {
  role: Role;
  claims: Claim[];
  archivedView?: boolean;
  carrierFilter?: string;
  searchQuery?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = ['firm_admin', 'super_admin'].includes(role);

  const carrierFiltered = carrierFilter
    ? claims.filter((c) => c.client.toLowerCase() === carrierFilter.toLowerCase())
    : claims;
  const statusFiltered = archivedView || filter === 'all' ? carrierFiltered : carrierFiltered.filter((c) => c.status === filter);
  const q = searchQuery?.trim().toLowerCase() ?? '';
  const filtered = q
    ? statusFiltered.filter(
        (c) =>
          c.number?.toLowerCase().includes(q) ||
          c.insured?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.client?.toLowerCase().includes(q),
      )
    : statusFiltered;
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Delete ${selectedIds.size} claim${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`);
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/claims/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        window.location.reload();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const countByStatus = (status: ClaimStatus) => carrierFiltered.filter((claim) => claim.status === status).length;
  const getFilterTone = (status: ClaimStatus): 'red' | 'orange' =>
    status === 'received' || status === 'on_hold' ? 'red' : 'orange';
  const filters = claimFilters.map((item) => {
    if (item.value === 'all') {
      return item;
    }

    return {
      ...item,
      count: countByStatus(item.value),
      tone: getFilterTone(item.value),
    };
  });
  const visibleFilters = archivedView ? filters.filter((item) => item.value === 'all') : filters;

  return (
    <div>
      <ClaimsFilters
        filter={filter}
        setFilter={setFilter}
        filters={visibleFilters}
        archiveViewActive={archivedView}
        showArchivedToggle={['firm_admin', 'super_admin'].includes(role)}
        onArchiveViewChange={(archived) => router.push(archived ? '/claims?view=archived' : '/claims')}
      />
      {q ? (
        <div style={{ padding: '8px 0 12px', fontSize: '12px', color: 'var(--muted)' }}>
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &lsquo;{searchQuery}&rsquo;
        </div>
      ) : null}
      {canDelete && selectedIds.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => void handleDeleteSelected()}
            disabled={isDeleting}
            style={{
              background: '#c0392b',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1,
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size}`}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              background: 'transparent',
              color: 'var(--muted)',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Clear
          </button>
        </div>
      )}
      {canDelete && filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 4px 8px' }}>
          <div
            onClick={toggleSelectAll}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              border: `2px solid ${selectedIds.size === filtered.length && filtered.length > 0 ? 'var(--sage)' : 'var(--border-hi)'}`,
              background: selectedIds.size === filtered.length && filtered.length > 0 ? 'var(--sage)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {selectedIds.size === filtered.length && filtered.length > 0 && (
              <span style={{ color: '#06120C', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>✓</span>
            )}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Select all
          </span>
        </div>
      )}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}
          >
            {q ? `No results for "${searchQuery}".` : archivedView ? 'No archived claims.' : filter === 'all' ? 'No claims yet.' : `No claims with status "${filter.replace(/_/g, ' ')}".`}
          </div>
        ) : null}
        {filtered.map((claim) => (
          <ClaimRow
            key={claim.id}
            claim={claim}
            role={role}
            archivedView={archivedView}
            selected={canDelete ? selectedIds.has(claim.id) : undefined}
            onToggleSelect={canDelete ? toggleSelect : undefined}
            onRestore={async (claimId) => {
              const response = await fetch(`/api/claims/${claimId}/archive`, {
                method: 'DELETE',
              });

              if (response.ok) {
                router.refresh();
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
