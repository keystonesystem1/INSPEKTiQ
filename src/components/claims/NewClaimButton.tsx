'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ClaimFormModal } from '@/components/claims/ClaimFormModal';

export function NewClaimButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Claim</Button>
      <ClaimFormModal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Manual Claim"
        subtitle="Enter claim details to create a received claim."
        submitLabel="Create Claim"
        onSubmit={async (values) => {
          const response = await fetch('/api/claims', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error ?? 'Unable to create claim.');
          }

          router.refresh();
        }}
      />
    </>
  );
}
