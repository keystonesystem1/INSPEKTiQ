'use client';

import { Table } from '@/components/ui/Table';
import { ClaimsFilters } from '@/components/claims/ClaimsFilters';
import { ClaimRow } from '@/components/claims/ClaimRow';
import { useClaims } from '@/hooks/useClaims';
import type { Role } from '@/lib/types';

export function ClaimsList({ role }: { role: Role }) {
  const { claims, filter, setFilter, claimFilters } = useClaims();
  const columns =
    role === 'adjuster'
      ? ['Claim #', 'Insured', 'Client', 'Type', 'DOL', 'Due Date', 'Status']
      : ['Claim #', 'Insured', 'Client', 'Type', 'DOL', 'Adjuster', 'Due Date', 'Status'];

  return (
    <div>
      <ClaimsFilters filter={filter} setFilter={setFilter} filters={claimFilters} />
      <Table columns={columns}>
        {claims.map((claim) => <ClaimRow key={claim.id} claim={claim} role={role} />)}
      </Table>
    </div>
  );
}
