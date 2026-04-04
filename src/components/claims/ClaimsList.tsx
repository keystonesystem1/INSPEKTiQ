'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/Table';
import { ClaimsFilters } from '@/components/claims/ClaimsFilters';
import { ClaimRow } from '@/components/claims/ClaimRow';
import type { Claim, ClaimStatus, Role } from '@/lib/types';

const claimFilters: Array<{ label: string; value: ClaimStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Received', value: 'received' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Inspected', value: 'inspected' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Closed', value: 'closed' },
  { label: 'On Hold', value: 'on_hold' },
];

export function ClaimsList({ role, claims }: { role: Role; claims: Claim[] }) {
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('all');
  const filtered = filter === 'all' ? claims : claims.filter((c) => c.status === filter);
  const columns =
    role === 'adjuster'
      ? ['Claim #', 'Insured', 'Client', 'Type', 'DOL', 'Due Date', 'Status']
      : ['Claim #', 'Insured', 'Client', 'Type', 'DOL', 'Adjuster', 'Due Date', 'Status'];

  return (
    <div>
      <ClaimsFilters filter={filter} setFilter={setFilter} filters={claimFilters} />
      <Table columns={columns}>
        {filtered.map((claim) => <ClaimRow key={claim.id} claim={claim} role={role} />)}
      </Table>
    </div>
  );
}
