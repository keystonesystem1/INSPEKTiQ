'use client';

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { AdjusterOption } from '@/lib/supabase/adjusters';

export function AssignAdjusterModal({
  open,
  onClose,
  claimId,
  adjusters,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  claimId: string;
  adjusters: AdjusterOption[];
  onAssigned?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Adjuster"
      subtitle="Select an active adjuster for this claim."
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div style={{ display: 'grid', gap: '10px' }}>
        {adjusters.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>No active adjusters available.</div>
        ) : null}

        {adjusters.map((adjuster) => (
          <div
            key={adjuster.userId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>{adjuster.email}</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>auth.users · {adjuster.userId}</div>
            </div>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError('');
                startTransition(async () => {
                  const response = await fetch(`/api/claims/${claimId}/assign`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ assignedUserId: adjuster.userId }),
                  });

                  if (!response.ok) {
                    const payload = (await response.json().catch(() => ({ error: 'Assignment failed' }))) as {
                      error?: string;
                    };
                    setError(payload.error ?? 'Assignment failed');
                    return;
                  }

                  onAssigned?.();
                  onClose();
                });
              }}
            >
              Select
            </Button>
          </div>
        ))}

        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
