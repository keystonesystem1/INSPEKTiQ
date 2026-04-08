'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

function isValidEmail(value: string) {
  return /.+@.+\..+/.test(value.trim());
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gap: '5px' }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}{required ? ' *' : ''}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
      />
    </label>
  );
}

export function InviteAdjusterModal({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: (message: string) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [maxActiveClaims, setMaxActiveClaims] = useState('10');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && isValidEmail(email);

  function reset() {
    setFirstName('');
    setLastName('');
    setEmail('');
    setMaxActiveClaims('10');
    setError(null);
  }

  function handleCancel() {
    reset();
    onClose();
  }

  async function handleSend() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const parsedMax = Number.parseInt(maxActiveClaims, 10);
      const response = await fetch('/api/adjusters/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          maxActiveClaims: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 10,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to send invite.');
      }
      const message = `Invitation sent to ${email.trim()}`;
      reset();
      onInvited(message);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send invite.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Invite Adjuster"
      subtitle="Send a Supabase auth invite and pre-create the adjuster record."
      onClose={handleCancel}
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button onClick={() => void handleSend()} disabled={!canSubmit || saving}>
            {saving ? 'Sending...' : 'Send Invite'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="First Name" value={firstName} onChange={setFirstName} required />
          <Field label="Last Name" value={lastName} onChange={setLastName} required />
        </div>
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
        <Field label="Max Active Claims" value={maxActiveClaims} onChange={setMaxActiveClaims} type="number" />
        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
