'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { addWeeks, eachDayOfInterval, endOfWeek, format, isToday, parseISO } from 'date-fns';
import type { Appointment } from '@/lib/types';
import { getWeeklyForecast, type DayForecast } from '@/lib/weather';

const HOUR_HEIGHT = 60;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 21;
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;

const DEFAULT_LOCATION = { lat: 31.5493, lng: -97.1467 };

function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function getTopPx(time: string): number {
  return Math.max(0, (timeToMinutes(time) - DAY_START_HOUR * 60) * (HOUR_HEIGHT / 60));
}

function getHeightPx(arrivalTime: string, endTime: string): number {
  return Math.max(20, (timeToMinutes(endTime) - timeToMinutes(arrivalTime)) * (HOUR_HEIGHT / 60));
}

function appointmentColors(status: Appointment['status']): string {
  if (status === 'pending') return 'border-[var(--orange)] bg-[rgba(224,123,63,0.2)] text-[var(--orange)]';
  if (status === 'confirmed') return 'border-[var(--sage)] bg-[rgba(91,194,115,0.2)] text-[var(--sage)]';
  if (status === 'completed') return 'border-[var(--blue)] bg-[rgba(66,152,204,0.2)] text-[var(--blue)]';
  if (status === 'needs_attention') return 'border-[var(--red)] bg-[rgba(224,92,92,0.15)] text-[var(--red)]';
  return 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]';
}

function getIconGlyph(iconCode: string): string {
  if (iconCode.startsWith('01')) return '☀';
  if (iconCode.startsWith('02')) return '⛅';
  if (iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁';
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return '🌧';
  if (iconCode.startsWith('11')) return '⛈';
  if (iconCode.startsWith('13')) return '❄';
  if (iconCode.startsWith('50')) return '🌫';
  return '·';
}

interface WeekCalendarProps {
  appointments: Appointment[];
  weekStart: Date;
  onWeekChange: (week: Date) => void;
  onToday: () => void;
  onOpenSchedule: (claimId?: string, date?: string) => void;
  onOpenDay: (date: string) => void;
}

export function WeekCalendar({
  appointments,
  weekStart,
  onWeekChange,
  onToday,
  onOpenSchedule,
  onOpenDay,
}: WeekCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [weatherCache, setWeatherCache] = useState<Record<string, DayForecast[]>>({});
  const weatherKey = `${DEFAULT_LOCATION.lat},${DEFAULT_LOCATION.lng}`;

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 0 }) }),
    [weekStart],
  );

  // Scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (7 - DAY_START_HOUR) * HOUR_HEIGHT;
    }
  }, []);

  useEffect(() => {
    if (weatherCache[weatherKey]) return;
    let cancelled = false;

    void (async () => {
      try {
        const forecast = await getWeeklyForecast(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
        if (!cancelled) setWeatherCache((prev) => ({ ...prev, [weatherKey]: forecast }));
      } catch {
        if (!cancelled) setWeatherCache((prev) => ({ ...prev, [weatherKey]: [] }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weatherCache, weatherKey]);

  const forecastByDate = useMemo(
    () => new Map((weatherCache[weatherKey] ?? []).map((d) => [d.date, d])),
    [weatherCache, weatherKey],
  );

  const now = new Date();
  const currentTimeTop = (now.getHours() * 60 + now.getMinutes() - DAY_START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const showCurrentTime = currentTimeTop >= 0 && currentTimeTop <= TOTAL_HOURS * HOUR_HEIGHT;
  const todayKey = format(now, 'yyyy-MM-dd');

  const weekLabel =
    days.length > 0 ? `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}` : '';

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
      {/* Navigation header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onWeekChange(addWeeks(weekStart, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]"
          >
            ‹
          </button>
          <div className="min-w-[210px] font-['Barlow_Condensed'] text-[16px] font-extrabold tracking-[0.06em] text-[var(--white)]">
            {weekLabel}
          </div>
          <button
            type="button"
            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]"
          >
            ›
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-[5px] border border-[var(--border)] px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]"
          >
            Today
          </button>
        </div>
      </div>

      {/* Day column headers */}
      <div
        className="grid border-b border-[var(--border)] bg-[var(--bg)]"
        style={{ gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))' }}
      >
        <div />
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const forecast = forecastByDate.get(dateKey);
          const today = isToday(day);
          return (
            <div key={dateKey} className="border-l border-[var(--border)] px-2 py-2 text-center">
              <div
                className={`font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] ${today ? 'text-[var(--sage)]' : 'text-[var(--faint)]'}`}
              >
                {format(day, 'EEE')}
              </div>
              <div
                className={`mt-[2px] font-['Barlow_Condensed'] text-[18px] font-extrabold leading-none ${today ? 'text-[var(--sage)]' : 'text-[var(--white)]'}`}
              >
                {format(day, 'd')}
              </div>
              <div className="mt-[3px] text-[10px] text-[var(--faint)]">
                {forecast ? `${getIconGlyph(forecast.iconCode)} ${forecast.high}°` : '·'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))',
            height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
          }}
        >
          {/* Time labels */}
          <div>
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = DAY_START_HOUR + i;
              return (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="flex items-start justify-end pr-2 pt-1"
                >
                  <span className="font-['Barlow_Condensed'] text-[10px] font-bold text-[var(--faint)]">
                    {format(new Date(2000, 0, 1, hour), 'ha').toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointments.filter(
              (a) => a.date === dateKey && a.status !== 'cancelled',
            );

            return (
              <div
                key={dateKey}
                role="button"
                tabIndex={0}
                aria-label={`Schedule on ${dateKey}`}
                className="relative cursor-pointer border-l border-[var(--border)] hover:bg-[rgba(255,255,255,0.01)]"
                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                onClick={() => onOpenSchedule(undefined, dateKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onOpenSchedule(undefined, dateKey);
                }}
              >
                {/* Hour grid lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="pointer-events-none absolute left-0 right-0 border-t border-[var(--border)]"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time indicator */}
                {showCurrentTime && dateKey === todayKey && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-[var(--sage)]"
                    style={{ top: currentTimeTop }}
                  >
                    <div className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full bg-[var(--sage)]" />
                  </div>
                )}

                {/* Appointments */}
                {dayAppointments.map((appt) => {
                  const top = getTopPx(appt.arrivalTime);
                  const height = getHeightPx(appt.arrivalTime, appt.endTime);
                  return (
                    <button
                      key={appt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDay(dateKey);
                      }}
                      className={`absolute left-[2px] right-[2px] overflow-hidden rounded-[4px] border-l-2 px-2 py-[3px] text-left font-['Barlow_Condensed'] text-[10px] font-bold leading-tight tracking-[0.04em] ${appointmentColors(appt.status)}`}
                      style={{ top, height }}
                    >
                      <div className="truncate">
                        {format(parseISO(`${appt.date}T${appt.arrivalTime}`), 'h:mm a')}
                      </div>
                      {height > 30 && (
                        <div className="truncate opacity-80">{appt.insuredName}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
