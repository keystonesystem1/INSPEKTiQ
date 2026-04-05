'use client';

import { useEffect, useEffectEvent, useState } from 'react';
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

  const loadDispatchData = useEffectEvent(async () => {
    if (!firmId) {
      setUnassignedClaims([]);
      setAssignedActiveClaims([]);
      setAdjusters([]);
      setCarrierOptions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextUnassignedClaims, nextAssignedActiveClaims, nextAdjusters, nextCarrierOptions] = await Promise.all([
        getUnassignedClaims(firmId),
        getAssignedActiveClaims(firmId),
        getAdjustersForDispatch(firmId),
        getFirmCarrierNames(firmId),
      ]);

      setUnassignedClaims(nextUnassignedClaims);
      setAssignedActiveClaims(nextAssignedActiveClaims);
      setAdjusters(nextAdjusters);
      setCarrierOptions(nextCarrierOptions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dispatch data.';
      setError(message);
    } finally {
      setLoading(false);
    }
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
          void loadDispatchData();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `firm_id=eq.${firmId}` },
        () => {
          void loadDispatchData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [firmId, loadDispatchData]);

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
