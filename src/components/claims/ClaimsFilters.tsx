'use client';

import { Pill } from '@/components/ui/Pill';
import type { ClaimStatus } from '@/lib/types';

export function ClaimsFilters({
  filter,
  setFilter,
  filters,
}: {
  filter: ClaimStatus | 'all';
  setFilter: (value: ClaimStatus | 'all') => void;
  filters: Array<{ label: string; value: ClaimStatus | 'all' }>;
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
      {filters.map((item) => (
        <Pill
          key={item.value}
          label={item.label}
          active={filter === item.value}
          onClick={() => setFilter(item.value)}
          dot={
            item.value === 'received'
              ? { tone: 'red', value: 2 }
              : item.value === 'in_review'
                ? { tone: 'orange', value: 3 }
                : undefined
          }
        />
      ))}
    </div>
  );
}
