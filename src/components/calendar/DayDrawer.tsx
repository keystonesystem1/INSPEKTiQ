import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export function DayDrawer({
  open,
  onClose,
  dateLabel,
  appointments,
}: {
  open: boolean;
  onClose: () => void;
  dateLabel: string;
  appointments: Appointment[];
}) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.2s ease', background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '14px 20px', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', letterSpacing: '0.06em' }}>{dateLabel}</div>
        <button onClick={onClose} style={{ color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {appointments.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No appointments on this day.</div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} style={{ minWidth: '200px', padding: '12px 14px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '13px', color: 'var(--sage)', marginBottom: '3px' }}>{appointment.arrivalTime}</div>
              <div style={{ fontWeight: 500, marginBottom: '2px' }}>{appointment.insured}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{appointment.address}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <Button size="sm" variant="ghost">View Claim</Button>
                <Button size="sm" variant="ghost">Message Insured</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
