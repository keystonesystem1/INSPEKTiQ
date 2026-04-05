'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import type { Appointment } from '@/lib/types';
import { getWeeklyForecast, type DayForecast } from '@/lib/weather';

const DEFAULT_LOCATION = { lat: 31.5493, lng: -97.1467 };

interface MonthCalendarProps {
  appointments: Appointment[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onToday: () => void;
  onOpenSchedule: (claimId?: string, date?: string) => void;
  onOpenDay: (date: string) => void;
}

function getAppointmentTone(status: Appointment['status']) {
  if (status === 'pending') return 'orange';
  if (status === 'confirmed') return 'sage';
  if (status === 'completed') return 'blue';
  if (status === 'needs_attention') return 'red';
  return 'faint';
}

function getIconGlyph(iconCode: string) {
  if (iconCode.startsWith('01')) return '☀';
  if (iconCode.startsWith('02')) return '⛅';
  if (iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁';
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return '🌧';
  if (iconCode.startsWith('11')) return '⛈';
  if (iconCode.startsWith('13')) return '❄';
  if (iconCode.startsWith('50')) return '🌫';
  return '•';
}

export function MonthCalendar({
  appointments,
  month,
  onMonthChange,
  onToday,
  onOpenSchedule,
  onOpenDay,
}: MonthCalendarProps) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [weatherCache, setWeatherCache] = useState<Record<string, DayForecast[]>>({});
  const [activeLocationKey, setActiveLocationKey] = useState(`${DEFAULT_LOCATION.lat},${DEFAULT_LOCATION.lng}`);
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(addDays(startOfMonth(addDays(endOfMonth(month), 1)), 34), { weekStartsOn: 0 });
  const cells = eachDayOfInterval({ start: gridStart, end: gridEnd }).slice(0, 42);
  const weatherKey = activeLocationKey;

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      if (weatherCache[weatherKey]) {
        return;
      }

      const [latText, lngText] = weatherKey.split(',');
      const lat = Number(latText);
      const lng = Number(lngText);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      try {
        const forecast = await getWeeklyForecast(lat, lng);
        if (!cancelled) {
          setWeatherCache((current) => ({
            ...current,
            [weatherKey]: forecast,
          }));
        }
      } catch {
        if (!cancelled) {
          setWeatherCache((current) => ({
            ...current,
            [weatherKey]: [],
          }));
        }
      }
    }

    void loadForecast();

    return () => {
      cancelled = true;
    };
  }, [weatherCache, weatherKey]);

  const forecastByDate = useMemo(
    () => new Map((weatherCache[weatherKey] ?? []).map((day) => [day.date, day])),
    [weatherCache, weatherKey],
  );
  const weatherRowDays = cells.slice(0, 7);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        <div className="flex items-center gap-2">
            <button
              type="button"
            onClick={() => onMonthChange(addMonths(monthStart, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--muted)] hover:border-[var(--border-hi)] hover:text-[var(--white)]"
          >
            ‹
          </button>
          <div className="min-w-[160px] font-['Barlow_Condensed'] text-[16px] font-extrabold tracking-[0.06em] text-[var(--white)]">
            {format(monthStart, 'MMMM yyyy')}
          </div>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(monthStart, 1))}
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

      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
        <div className="grid grid-cols-7 gap-3">
          {weatherRowDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const forecast = forecastByDate.get(key);
            return (
              <div key={key} className="text-center">
                <div className="text-[14px] text-[var(--muted)]">{forecast ? getIconGlyph(forecast.iconCode) : '·'}</div>
                <div className="mt-1 text-[10px] text-[var(--faint)]">
                  {forecast ? `${forecast.high}°` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="px-3 py-2 text-center font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {cells.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const inCurrentMonth = isSameMonth(day, monthStart);
          const forecast = forecastByDate.get(dateKey);
          const dayAppointments = appointments
            .filter((appointment) => appointment.status !== 'cancelled' && appointment.date === dateKey)
            .sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
          const visibleAppointments = dayAppointments.slice(0, 2);
          const overflowCount = Math.max(0, dayAppointments.length - visibleAppointments.length);

          return (
            <button
              key={`${dateKey}-${index}`}
              type="button"
              onClick={() => onOpenDay(dateKey)}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverDate(dateKey);
              }}
              onDragLeave={() => {
                setDragOverDate((current) => (current === dateKey ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const claimId = event.dataTransfer.getData('text/plain');
                setDragOverDate(null);
                onOpenSchedule(claimId || undefined, dateKey);
              }}
              className={`relative flex min-h-0 flex-col border-b border-r border-[var(--border)] px-3 py-2 text-left transition hover:bg-[rgba(255,255,255,0.02)] ${
                dragOverDate === dateKey ? 'outline outline-1 outline-dashed outline-[var(--sage)] bg-[rgba(91,194,115,0.08)]' : ''
              } ${index % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-['Barlow_Condensed'] text-[12px] font-bold ${
                    inCurrentMonth ? 'text-[var(--muted)]' : 'text-[var(--faint)]'
                  } ${isToday(day) ? 'ring-2 ring-[var(--sage)] text-[var(--sage)]' : ''}`}
                >
                  {format(day, 'd')}
                </span>
                <span className="text-[10px] text-[var(--faint)]">{forecast ? getIconGlyph(forecast.iconCode) : '·'}</span>
              </div>

              <div className="min-h-0 flex-1 space-y-1">
                {inCurrentMonth
                  ? visibleAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        onMouseEnter={() => {
                          if (appointment.lossLat !== null && appointment.lossLng !== null) {
                            setActiveLocationKey(`${appointment.lossLat},${appointment.lossLng}`);
                          }
                        }}
                        onMouseLeave={() => {
                          setActiveLocationKey(`${DEFAULT_LOCATION.lat},${DEFAULT_LOCATION.lng}`);
                        }}
                        className={`truncate rounded-[4px] border-l-2 px-2 py-1 font-['Barlow_Condensed'] text-[10px] font-bold tracking-[0.04em] ${
                          getAppointmentTone(appointment.status) === 'orange'
                            ? 'border-[var(--orange)] bg-[rgba(224,123,63,0.2)] text-[var(--orange)]'
                            : getAppointmentTone(appointment.status) === 'sage'
                              ? 'border-[var(--sage)] bg-[rgba(91,194,115,0.2)] text-[var(--sage)]'
                              : getAppointmentTone(appointment.status) === 'blue'
                                ? 'border-[var(--blue)] bg-[rgba(66,152,204,0.2)] text-[var(--blue)]'
                                : 'border-[var(--red)] bg-[rgba(224,92,92,0.15)] text-[var(--red)]'
                        }`}
                      >
                        {appointment.arrivalTime} · {appointment.insuredName}
                      </div>
                    ))
                  : null}
                {inCurrentMonth && overflowCount > 0 ? (
                  <Badge tone="faint">+{overflowCount} more</Badge>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
