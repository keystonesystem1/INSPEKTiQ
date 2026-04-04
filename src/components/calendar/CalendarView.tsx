'use client';

import { useState } from 'react';
import { addDays, format, startOfMonth } from 'date-fns';
import { demoAppointments } from '@/lib/utils/demo-data';
import { Button } from '@/components/ui/Button';
import { ScheduleQueue } from '@/components/calendar/ScheduleQueue';
import { RouteMap } from '@/components/calendar/RouteMap';
import { DayDrawer } from '@/components/calendar/DayDrawer';
import { ScheduleModal } from '@/components/calendar/ScheduleModal';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weather = ['72° ☀', '68° ☁', '70° ☀', '74° ⛅', '77° ☀', '73° 🌧', '69° ☁'];

export function CalendarView() {
  const [routeMapOpen, setRouteMapOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDateLabel, setSelectedDateLabel] = useState('Appointments · April 5');
  const [scheduleClaimId, setScheduleClaimId] = useState<string | undefined>();
  const [scheduleDate, setScheduleDate] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const monthStart = startOfMonth(new Date('2026-04-01T00:00:00.000Z'));
  const cells = Array.from({ length: 35 }, (_, index) => addDays(monthStart, index));

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--nav-h) - 56px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <ScheduleQueue
        onStartSchedule={(claimId) => {
          setScheduleClaimId(claimId);
          setModalOpen(true);
        }}
      />
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ width: '28px', height: '28px', borderRadius: '5px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>‹</button>
            <button style={{ width: '28px', height: '28px', borderRadius: '5px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>›</button>
            <div style={{ minWidth: '160px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.06em' }}>April 2026</div>
            <Button size="sm" variant="ghost">Today</Button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', color: 'var(--muted)', fontSize: '11px' }}>
              <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sage)' }} /> Confirmed
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRouteMapOpen((value) => !value)}>
              ◉ Map
            </Button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          {weekdays.map((day, index) => (
            <div key={day} style={{ padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faint)' }}>{day}</div>
              <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '4px' }}>{weather[index]}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
          {cells.map((date, index) => (
            <div
              key={date.toISOString()}
              onClick={() => {
                setSelectedDateLabel(`Appointments · ${format(date, 'MMMM d')}`);
                setDrawerOpen(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const claimId = event.dataTransfer.getData('text/plain');
                setScheduleClaimId(claimId);
                setScheduleDate(format(date, 'yyyy-MM-dd'));
                setModalOpen(true);
              }}
              style={{
                borderRight: index % 7 === 6 ? 'none' : '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', color: 'var(--muted)' }}>
                <span>{format(date, 'd')}</span>
                <span style={{ fontSize: '10px', color: 'var(--faint)' }}>⛅</span>
              </div>
              {demoAppointments
                .filter((appointment) => appointment.date === format(date, 'yyyy-MM-dd'))
                .map((appointment) => (
                  <div key={appointment.id} style={{ borderRadius: '4px', padding: '3px 6px', fontSize: '10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.04em', background: appointment.status === 'confirmed' ? 'rgba(91,194,115,0.2)' : 'rgba(224,123,63,0.2)', color: appointment.status === 'confirmed' ? 'var(--sage)' : 'var(--orange)', borderLeft: `2px solid ${appointment.status === 'confirmed' ? 'var(--sage)' : 'var(--orange)'}` }}>
                    {appointment.arrivalTime} · {appointment.insured}
                  </div>
                ))}
            </div>
          ))}
        </div>
        <DayDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} dateLabel={selectedDateLabel} />
      </section>
      <RouteMap open={routeMapOpen} onClose={() => setRouteMapOpen(false)} />
      <ScheduleModal open={modalOpen} onClose={() => setModalOpen(false)} claimId={scheduleClaimId} date={scheduleDate} />
    </div>
  );
}
