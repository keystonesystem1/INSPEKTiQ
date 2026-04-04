'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';

export function OverrideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override Required"
      subtitle="Capability mismatches were found for the selected assignment."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={reason.trim().length < 10} onClick={onClose}>Override Assignment</Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
        {['Claim requires TWIA cert', 'Carrier not in approved carrier list', 'Adjuster at or over capacity'].map((warning) => (
          <div key={warning} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--orange-dim)', border: '1px solid rgba(224,123,63,0.2)', color: 'var(--orange)' }}>
            {warning}
          </div>
        ))}
      </div>
      <FormInput label="Reason for Override" value={reason} onChange={setReason} multiline />
    </Modal>
  );
}
