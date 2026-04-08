'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type RecipientType = 'insured' | 'contractor' | 'carrier' | 'public_adjuster' | 'other';
type SendMethod = 'email' | 'sms';

const RECIPIENT_TYPES: Array<{ value: RecipientType; label: string }> = [
  { value: 'insured', label: 'Insured' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'public_adjuster', label: 'Public Adjuster' },
  { value: 'other', label: 'Other' },
];

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: '5px' }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
      />
    </label>
  );
}

export function SendUploadLinkModal({
  open,
  onClose,
  claimId,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  claimId: string;
  onSent: (message: string) => void;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('insured');
  const [method, setMethod] = useState<SendMethod>('email');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setRecipientName('');
    setRecipientType('insured');
    setMethod('email');
    setContact('');
    setError(null);
  }

  function handleCancel() {
    reset();
    onClose();
  }

  async function handleSend() {
    if (!contact.trim()) {
      setError(method === 'email' ? 'Email is required.' : 'Phone number is required.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/claims/${claimId}/upload-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType,
          recipientName: recipientName.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to create upload link.');
      }
      const body = (await response.json()) as { url: string };
      const friendlyName = recipientName.trim() || 'there';
      const messageBody = `Hi ${friendlyName}, please upload your documents using this secure link:\n\n${body.url}\n\nThis link expires in 7 days.`;

      if (method === 'email') {
        const subject = encodeURIComponent('Document upload link');
        const mailBody = encodeURIComponent(messageBody);
        window.location.href = `mailto:${encodeURIComponent(contact.trim())}?subject=${subject}&body=${mailBody}`;
      } else {
        const smsBody = encodeURIComponent(messageBody);
        window.location.href = `sms:${encodeURIComponent(contact.trim())}?body=${smsBody}`;
      }

      reset();
      onSent('Upload link ready. Opening your mail/SMS app...');
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create upload link.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Send Upload Link"
      subtitle="Generate a secure upload link and share it with the recipient."
      onClose={handleCancel}
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel} disabled={sending}>Cancel</Button>
          <Button onClick={() => void handleSend()} disabled={sending}>
            {sending ? 'Creating...' : 'Send Link'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <Field label="Recipient Name" value={recipientName} onChange={setRecipientName} placeholder="Jane Doe" />
        <label style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Recipient Type
          </span>
          <select
            value={recipientType}
            onChange={(event) => setRecipientType(event.target.value as RecipientType)}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
          >
            {RECIPIENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Send via
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['email', 'sms'] as SendMethod[]).map((value) => {
              const active = method === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: active ? '1px solid rgba(91,194,115,0.25)' : '1px solid var(--border)',
                    background: active ? 'var(--sage-dim)' : 'transparent',
                    color: active ? 'var(--sage)' : 'var(--muted)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {value === 'email' ? 'Email' : 'SMS'}
                </button>
              );
            })}
          </div>
        </div>
        <Field
          label={method === 'email' ? 'Email' : 'Phone Number'}
          value={contact}
          onChange={setContact}
          type={method === 'email' ? 'email' : 'tel'}
          placeholder={method === 'email' ? 'name@example.com' : '+1 555 123 4567'}
        />
        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
