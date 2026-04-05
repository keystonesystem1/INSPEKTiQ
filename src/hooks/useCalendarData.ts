'use client';

import { useEffect, useEffectEvent, useState } from 'react';
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

  const loadCalendarData = useEffectEvent(async () => {
    if (!firmId || !adjusterUserId) {
      setClaimsNeedingScheduling([]);
      setAppointments([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextQueue, nextAppointments] = await Promise.all([
        getClaimsNeedingScheduling(firmId, adjusterUserId),
        getAppointments(firmId, adjusterUserId, from, to),
      ]);

      setClaimsNeedingScheduling(nextQueue);
      setAppointments(nextAppointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
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
          void loadCalendarData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [adjusterUserId, firmId, from, loadCalendarData, to]);

  return {
    claimsNeedingScheduling,
    appointments,
    loading,
    error,
    refresh: loadCalendarData,
  };
}
