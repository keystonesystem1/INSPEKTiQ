'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAppointments, getClaimsNeedingScheduling } from '@/lib/supabase/calendar';
import type { Appointment, SchedulingQueueItem } from '@/lib/types';

interface UseCalendarDataResult {
  claimsNeedingScheduling: SchedulingQueueItem[];
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCalendarData(
  firmId: string,
  adjusterUserId: string,
  from: string,
  to: string,
): UseCalendarDataResult {
  const [claimsNeedingScheduling, setClaimsNeedingScheduling] = useState<SchedulingQueueItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequenceRef = useRef(0);
  const activeRequestRef = useRef(0);
  const isFetchingRef = useRef(false);

  const loadCalendarData = useEffectEvent(async (options?: { preserveLoadingState?: boolean }) => {
    if (!firmId || !adjusterUserId) {
      setClaimsNeedingScheduling([]);
      setAppointments([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    activeRequestRef.current = requestId;
    isFetchingRef.current = true;

    if (!options?.preserveLoadingState) {
      setLoading(true);
    }
    setError(null);

    try {
      const [nextQueue, nextAppointments] = await Promise.all([
        getClaimsNeedingScheduling(firmId, adjusterUserId),
        getAppointments(firmId, adjusterUserId, from, to),
      ]);

      if (activeRequestRef.current !== requestId) {
        return;
      }

      setClaimsNeedingScheduling(nextQueue);
      setAppointments(nextAppointments);
    } catch (err) {
      if (activeRequestRef.current !== requestId) {
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load calendar data.');
    } finally {
      if (activeRequestRef.current === requestId) {
        isFetchingRef.current = false;
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
      void loadCalendarData({ preserveLoadingState: true });
    }, 300);
  });

  useEffect(() => {
    void loadCalendarData();

    if (!firmId || !adjusterUserId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`calendar-data-${firmId}-${adjusterUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `adjuster_user_id=eq.${adjusterUserId}` },
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
  }, [adjusterUserId, firmId, from, loadCalendarData, scheduleRealtimeRefresh, to]);

  return {
    claimsNeedingScheduling,
    appointments,
    loading,
    error,
    refresh: () => loadCalendarData({ preserveLoadingState: true }),
  };
}
