'use client';

import { useState } from 'react';
import type { Claim } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';

export function ScheduleModal({
  open,
  onClose,
  claimId,
  claims,
  date,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  claimId?: string;
  claims: Claim[];
  date?: string;
  onScheduled: () => void;
}) {
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedDate, setSelectedDate] = useState(date ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const claim = claims.find((c) => c.id === claimId);
  const displayDate = date ?? selectedDate;

  async function handleConfirm() {
    if (!claimId || !displayDate) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          date: displayDate,
          arrivalTime,
          endTime,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setNotes('');
        onScheduled();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Claim"
      subtitle="Create appointment and notify the insured."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!claimId || !displayDate || submitting} onClick={handleConfirm}>
            {submitting ? 'Scheduling...' : 'Confirm Schedule'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <FormInput label="Claim" value={claim ? `${claim.insured} — ${claim.address}` : 'Select claim'} onChange={() => undefined} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Date" value={displayDate} onChange={setSelectedDate} />
          <FormInput label="Arrival Time" value={arrivalTime} onChange={setArrivalTime} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Window End Time" value={endTime} onChange={setEndTime} />
          <FormInput label="Notify Insured Via" value="Both" onChange={() => undefined} />
        </div>
        <FormInput label="Notes" value={notes} onChange={setNotes} multiline />
      </div>
    </Modal>
  );
}
