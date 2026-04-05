'use client';

import { useState } from 'react';
import { addDays, format, startOfMonth } from 'date-fns';
import type { Appointment, Claim } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ScheduleQueue } from '@/components/calendar/ScheduleQueue';
import { RouteMap } from '@/components/calendar/RouteMap';
import { DayDrawer } from '@/components/calendar/DayDrawer';
import { ScheduleModal } from '@/components/calendar/ScheduleModal';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({
  claims,
  appointments,
}: {
  claims: Claim[];
  appointments: Appointment[];
}) {
  const [routeMapOpen, setRouteMapOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleClaimId, setScheduleClaimId] = useState<string | undefined>();
  const [scheduleDate, setScheduleDate] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const cells = Array.from({ length: 35 }, (_, index) => addDays(monthStart, index));

  const selectedDateLabel = selectedDate
    ? `Appointments · ${format(new Date(selectedDate + 'T00:00:00'), 'MMMM d')}`
    : 'Appointments';

  const dayAppointments = selectedDate
    ? appointments.filter((a) => a.date === selectedDate)
    : [];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--nav-h) - 56px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <ScheduleQueue
        claims={claims}
        onStartSchedule={(claimId) => {
          setScheduleClaimId(claimId);
          setModalOpen(true);
        }}
      />
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ minWidth: '160px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.06em' }}>{format(now, 'MMMM yyyy')}</div>
            <Button size="sm" variant="ghost">Today</Button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', color: 'var(--muted)', fontSize: '11px' }}>
              <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sage)' }} /> Confirmed
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRouteMapOpen((v: boolean) => !v)}>
              ◉ Map
            </Button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          {weekdays.map((day) => (
            <div key={day} style={{ padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>{day}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
          {cells.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const cellAppointments = appointments.filter((a) => a.date === dateStr);
            return (
              <div
                key={date.toISOString()}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setDrawerOpen(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const claimId = event.dataTransfer.getData('text/plain');
                  setScheduleClaimId(claimId);
                  setScheduleDate(dateStr);
                  setModalOpen(true);
                }}
                style={{
                  borderRight: index % 7 === 6 ? 'none' : '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', color: 'var(--muted)' }}>
                  <span>{format(date, 'd')}</span>
                </div>
                {cellAppointments.map((appointment) => (
                  <div key={appointment.id} style={{ borderRadius: '4px', padding: '3px 6px', fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.04em', background: appointment.status === 'confirmed' ? 'rgba(91,194,115,0.2)' : 'rgba(224,123,63,0.2)', color: appointment.status === 'confirmed' ? 'var(--sage)' : 'var(--orange)', borderLeft: `2px solid ${appointment.status === 'confirmed' ? 'var(--sage)' : 'var(--orange)'}` }}>
                    {appointment.arrivalTime} · {appointment.insured}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <DayDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} dateLabel={selectedDateLabel} appointments={dayAppointments} />
      </section>
      <RouteMap open={routeMapOpen} onClose={() => setRouteMapOpen(false)} appointments={appointments} />
      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        claimId={scheduleClaimId}
        claims={claims}
        date={scheduleDate}
        onScheduled={() => {
          setModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
