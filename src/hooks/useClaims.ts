'use client';

import { useMemo, useState } from 'react';
import { demoClaims } from '@/lib/utils/demo-data';
import type { Claim, ClaimStatus } from '@/lib/types';

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

export function useClaims() {
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('all');

  const claims = useMemo<Claim[]>(() => {
    if (filter === 'all') {
      return demoClaims;
    }

    return demoClaims.filter((claim) => claim.status === filter);
  }, [filter]);

  return { claims, filter, setFilter, claimFilters };
}
