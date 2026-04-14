'use client';

import { useEffect, useRef, useState } from 'react';
import type { ClaimStatus } from '@/lib/types';

export function ClaimsFilters({
  filter,
  setFilter,
  filters,
  archiveViewActive = false,
  showArchivedToggle = false,
  onArchiveViewChange,
}: {
  filter: ClaimStatus | 'all';
  setFilter: (value: ClaimStatus | 'all') => void;
  filters: Array<{
    label: string;
    value: ClaimStatus | 'all';
    count?: number;
    tone?: 'red' | 'orange';
  }>;
  archiveViewActive?: boolean;
  showArchivedToggle?: boolean;
  onArchiveViewChange?: (archived: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const activeFilter = filters.find((f) => f.value === filter);
  const activeLabel = activeFilter ? activeFilter.label : 'All Claims';

  const allOptions = [
    ...(showArchivedToggle
      ? [{ label: 'Archived', value: 'archived' as const, isArchive: true }]
      : []),
    ...filters.map((f) => ({ ...f, isArchive: false as const })),
  ];

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', marginBottom: '18px' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--white)',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: 'var(--muted)' }}>Filter:</span>
        <span>{archiveViewActive ? 'Archived' : activeLabel}</span>
        <span style={{ color: 'var(--muted)', fontSize: '9px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 20,
            minWidth: '200px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          {allOptions.map((option) => {
            const isActive = option.isArchive ? archiveViewActive : (filter === option.value && !archiveViewActive);
            const count = 'count' in option ? option.count : undefined;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (option.isArchive) {
                    onArchiveViewChange?.(!archiveViewActive);
                  } else {
                    setFilter(option.value as ClaimStatus | 'all');
                    if (archiveViewActive) onArchiveViewChange?.(false);
                  }
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  background: isActive ? 'var(--card-hi)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  color: isActive ? 'var(--white)' : 'var(--muted)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: '12px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{option.label}</span>
                {count && count > 0 ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      borderRadius: '999px',
                      background: 'tone' in option && option.tone === 'red' ? 'var(--red-dim)' : 'var(--orange-dim)',
                      color: 'tone' in option && option.tone === 'red' ? 'var(--red)' : 'var(--orange)',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
