'use client';

import { useMemo, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { DayDrawer } from '@/components/calendar/DayDrawer';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { ScheduleModal } from '@/components/calendar/ScheduleModal';
import { SchedulingQueue } from '@/components/calendar/SchedulingQueue';
import { useCalendarData } from '@/hooks/useCalendarData';

interface CalendarPageProps {
  firmId: string;
  adjusterUserId: string;
}

export function CalendarPage({ firmId, adjusterUserId }: CalendarPageProps) {
  const [routeMapOpen, setRouteMapOpen] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleClaimId, setScheduleClaimId] = useState<string | undefined>();
  const [scheduleDate, setScheduleDate] = useState<string | undefined>();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const from = format(monthStart, 'yyyy-MM-dd');
  const to = format(monthEnd, 'yyyy-MM-dd');

  const {
    claimsNeedingScheduling,
    appointments,
    loading,
    error,
    refresh,
  } = useCalendarData(firmId, adjusterUserId, from, to);
  const selectedDayAppointments = useMemo(
    () =>
      selectedDay
        ? appointments.filter((appointment) => appointment.status !== 'cancelled' && appointment.date === selectedDay)
        : [],
    [appointments, selectedDay],
  );

  return (
    <div className="-mx-8 -my-7 h-[calc(100vh-var(--nav-h))] overflow-hidden">
      <div className="grid h-full grid-cols-[280px_minmax(0,1fr)_auto] border-y border-[var(--border)] bg-[var(--bg)]">
        <SchedulingQueue
          claims={claimsNeedingScheduling}
          loading={loading}
          error={error}
          onSchedule={(claimId) => {
            setScheduleClaimId(claimId);
            setScheduleDate(undefined);
            setScheduleModalOpen(true);
          }}
          onFirstContact={async (claimId) => {
            const response = await fetch(`/api/claims/${claimId}/status`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'contacted' }),
            });

            if (response.ok) {
              await refresh();
            }
          }}
        />

        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3">
            <div className="font-['Barlow_Condensed'] text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
              Calendar
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-[3px]">
                <div className="flex gap-[2px]">
                  <button
                    type="button"
                    className="rounded-[4px] bg-[var(--sage)] px-[10px] py-[5px] font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[#06120C]"
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-[4px] px-[10px] py-[5px] font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] opacity-60"
                  >
                    Week
                  </button>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setRouteMapOpen((value) => !value)}>
                ◉ Map
              </Button>
            </div>
          </div>

          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
            <div className="grid grid-cols-7 gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center">
                  <div className="font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
                    {day}
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--faint)]">Weather</div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-[var(--bg)] p-5">
            <div className="relative h-full">
              <MonthCalendar
                appointments={appointments}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                onToday={() => setCurrentMonth(startOfMonth(new Date()))}
                onOpenSchedule={(claimId, date) => {
                  setScheduleClaimId(claimId);
                  setScheduleDate(date);
                  setScheduleModalOpen(true);
                }}
                onOpenDay={(date) => {
                  setSelectedDay(date);
                  setDayDrawerOpen(true);
                }}
              />
              <DayDrawer
                open={dayDrawerOpen}
                onClose={() => setDayDrawerOpen(false)}
                date={selectedDay}
                appointments={selectedDayAppointments}
              />
            </div>
          </div>
        </section>

        <aside
          className={`flex min-h-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] transition-all duration-200 ${
            routeMapOpen ? 'w-[320px] min-w-[320px] opacity-100' : 'w-0 min-w-0 opacity-0'
          }`}
        >
          {routeMapOpen ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div className="font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
                  Route Map
                </div>
                <button
                  type="button"
                  onClick={() => setRouteMapOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
                >
                  ✕
                </button>
              </div>

              <div className="mx-4 mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-3 py-3">
                <div className="mb-2 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Route Summary
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--muted)]">Stops</span>
                  <strong className="text-[var(--white)]">{appointments.length}</strong>
                </div>
                <div className="mt-1 flex justify-between text-[12px]">
                  <span className="text-[var(--muted)]">Needs Scheduling</span>
                  <strong className="text-[var(--white)]">{claimsNeedingScheduling.length}</strong>
                </div>
              </div>

              <div className="m-4 flex-1 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex h-full items-center justify-center rounded-[10px] border border-dashed border-[var(--border-hi)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
                  <div className="text-center">
                    <div className="font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                      Route Map Shell
                    </div>
                    <p className="mt-2 max-w-[220px] text-[12px] leading-5 text-[var(--muted)]">
                      Appointments and scheduling queue are now live. The full route map interactions stay in later calendar steps.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </aside>
      </div>
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        claimId={scheduleClaimId}
        date={scheduleDate}
      />
    </div>
  );
}
