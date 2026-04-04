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
  filters: Array<{
    label: string;
    value: ClaimStatus | 'all';
    count?: number;
    tone?: 'red' | 'orange';
  }>;
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
      {filters.map((item) => (
        <Pill
          key={item.value}
          label={item.label}
          active={filter === item.value}
          onClick={() => setFilter(item.value)}
          dot={item.count && item.count > 0 ? { tone: item.tone ?? 'orange', value: item.count } : undefined}
        />
      ))}
    </div>
  );
}
