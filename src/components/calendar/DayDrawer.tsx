'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Appointment } from '@/lib/types';

interface DayDrawerProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  appointments: Appointment[];
}

function getStatusTone(status: Appointment['status']) {
  if (status === 'confirmed') return 'sage';
  if (status === 'pending') return 'orange';
  if (status === 'completed') return 'blue';
  if (status === 'needs_attention') return 'red';
  return 'faint';
}

export function DayDrawer({
  open,
  onClose,
  date,
  appointments,
}: DayDrawerProps) {
  const router = useRouter();
  const [localAppointments, setLocalAppointments] = useState(appointments);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dateLabel = date ? format(parseISO(date), 'EEEE, MMMM d') : 'Appointments';

  async function handleConfirmCancel(appointmentId: string) {
    setCancelling(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? 'Failed to cancel appointment.');
      }
      setLocalAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
      setToast('Appointment cancelled.');
      setTimeout(() => setToast(null), 3000);
      router.refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to cancel appointment.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setCancelling(false);
      setConfirmingId(null);
    }
  }

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 h-[40%] min-h-[260px] border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition-transform duration-200 ${
        open ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-['Barlow_Condensed'] text-[14px] font-extrabold tracking-[0.06em] text-[var(--white)]">
          {dateLabel}
        </div>
        <button type="button" onClick={onClose} className="text-[var(--muted)]">
          ✕
        </button>
      </div>
      {toast ? (
        <div className="mb-3 rounded-[6px] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--muted)]">
          {toast}
        </div>
      ) : null}

      {localAppointments.length ? (
        <div className="flex flex-wrap gap-3 overflow-y-auto">
          {localAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="min-w-[220px] rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-[14px] py-3"
            >
              <div className="font-['Barlow_Condensed'] text-[13px] font-extrabold text-[var(--sage)]">
                {format(parseISO(`${appointment.date}T${appointment.arrivalTime}`), 'h:mm a')}
              </div>
              <div className="mt-1 text-[13px] font-medium text-[var(--white)]">{appointment.insuredName}</div>
              <div className="mt-1 text-[11px] text-[var(--muted)]">{appointment.lossAddress}</div>
              <div className="mt-2 text-[11px] text-[var(--muted)]">Adjuster: {appointment.adjusterName}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge tone="faint">{appointment.lossType}</Badge>
                <Badge tone={getStatusTone(appointment.status)}>{appointment.status}</Badge>
              </div>
              {confirmingId === appointment.id ? (
                <div className="mt-3">
                  <div className="mb-2 text-[11px] text-[var(--muted)]">Cancel this appointment?</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)} disabled={cancelling}>
                      Never Mind
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void handleConfirmCancel(appointment.id)} disabled={cancelling}>
                      {cancelling ? 'Cancelling…' : 'Cancel Appointment'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <a href={`/claims/${appointment.claimId}`}>
                    <Button size="sm" variant="ghost">View Claim</Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingId(appointment.id)}>Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[12px] text-[var(--muted)]">No inspections scheduled for this day</div>
      )}
    </div>
  );
}
