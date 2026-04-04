'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';

export function ScheduleModal({
  open,
  onClose,
  claimId,
  date,
}: {
  open: boolean;
  onClose: () => void;
  claimId?: string;
  date?: string;
}) {
  const [message, setMessage] = useState('Inspection scheduled for the selected date and window. Insured confirmed.');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Claim"
      subtitle="Create appointment and notify the insured."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Confirm Schedule</Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <FormInput label="Claim" value={claimId ?? 'Select claim'} onChange={() => undefined} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Date" value={date ?? '2026-04-05'} onChange={() => undefined} />
          <FormInput label="Arrival Time" value="09:00" onChange={() => undefined} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Window End Time" value="11:00" onChange={() => undefined} />
          <FormInput label="Notify Insured Via" value="Both" onChange={() => undefined} />
        </div>
        <FormInput label="Message to Insured" value={message} onChange={setMessage} multiline />
      </div>
    </Modal>
  );
}
