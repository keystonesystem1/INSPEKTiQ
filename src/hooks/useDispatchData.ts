'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdjustersForDispatch, getAssignedActiveClaims, getFirmCarrierNames, getUnassignedClaims } from '@/lib/supabase/dispatch';
import type { DispatchAdjuster, DispatchClaim } from '@/lib/types';

interface UseDispatchDataResult {
  unassignedClaims: DispatchClaim[];
  assignedActiveClaims: DispatchClaim[];
  adjusters: DispatchAdjuster[];
  carrierOptions: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDispatchData(firmId: string): UseDispatchDataResult {
  const [unassignedClaims, setUnassignedClaims] = useState<DispatchClaim[]>([]);
  const [assignedActiveClaims, setAssignedActiveClaims] = useState<DispatchClaim[]>([]);
  const [adjusters, setAdjusters] = useState<DispatchAdjuster[]>([]);
  const [carrierOptions, setCarrierOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequenceRef = useRef(0);
  const activeRequestRef = useRef(0);

  const loadDispatchData = useEffectEvent(async (options?: { preserveLoadingState?: boolean }) => {
    if (!firmId) {
      setUnassignedClaims([]);
      setAssignedActiveClaims([]);
      setAdjusters([]);
      setCarrierOptions([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    activeRequestRef.current = requestId;

    if (!options?.preserveLoadingState) {
      setLoading(true);
    }
    setError(null);

    try {
      const [nextUnassignedClaims, nextAssignedActiveClaims, nextAdjusters, nextCarrierOptions] = await Promise.all([
        getUnassignedClaims(firmId),
        getAssignedActiveClaims(firmId),
        getAdjustersForDispatch(firmId),
        getFirmCarrierNames(firmId),
      ]);

      if (activeRequestRef.current !== requestId) {
        return;
      }

      setUnassignedClaims(nextUnassignedClaims);
      setAssignedActiveClaims(nextAssignedActiveClaims);
      setAdjusters(nextAdjusters);
      setCarrierOptions(nextCarrierOptions);
    } catch (err) {
      if (activeRequestRef.current !== requestId) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to load dispatch data.';
      setError(message);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  });

  const scheduleRealtimeRefresh = useEffectEvent(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void loadDispatchData({ preserveLoadingState: true });
    }, 300);
  });

  useEffect(() => {
    void loadDispatchData();

    if (!firmId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`dispatch-data-${firmId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claims', filter: `firm_id=eq.${firmId}` },
        () => {
          scheduleRealtimeRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `firm_id=eq.${firmId}` },
        () => {
          scheduleRealtimeRefresh();
        },
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [firmId, loadDispatchData, scheduleRealtimeRefresh]);

  return {
    unassignedClaims,
    assignedActiveClaims,
    adjusters,
    carrierOptions,
    loading,
    error,
    refresh: loadDispatchData,
  };
}
