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
  { label: 'Inspected', value: 'inspected' },
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
