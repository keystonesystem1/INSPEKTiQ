'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Table } from '@/components/ui/Table';
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
}: {
  role: Role;
  claims: Claim[];
  archivedView?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('all');
  const filtered = archivedView || filter === 'all' ? claims : claims.filter((c) => c.status === filter);
  const countByStatus = (status: ClaimStatus) => claims.filter((claim) => claim.status === status).length;
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
  const columns =
    role === 'adjuster'
      ? ['Claim #', 'Insured', 'Client', 'Type', 'DOL', 'Due Date', 'Status']
      : ['Claim #', 'Insured', 'Client', 'Type', 'DOL', 'Adjuster', 'Due Date', 'Status'];

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
      <Table columns={columns}>
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
      </Table>
    </div>
  );
}
