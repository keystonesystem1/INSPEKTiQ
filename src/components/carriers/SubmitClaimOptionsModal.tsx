'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function SubmitClaimOptionsModal({
  open,
  onClose,
  intakeEmail,
  firmPhone,
  onChooseForm,
}: {
  open: boolean;
  onClose: () => void;
  intakeEmail: string | null;
  firmPhone?: string | null;
  onChooseForm: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!intakeEmail) return;
    try {
      await navigator.clipboard.writeText(intakeEmail);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Modal
      open={open}
      title="Submit a Claim"
      subtitle="Choose how you'd like to send us this claim."
      onClose={onClose}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        {/* Option 1 — form */}
        <button
          type="button"
          onClick={onChooseForm}
          style={{
            textAlign: 'left',
            padding: '16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'border-color 120ms ease',
          }}
        >
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', color: 'var(--white)', marginBottom: '4px' }}>
            📝 Fill out a claim form
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Enter claim details and attach files directly in the portal. Fastest option.
          </div>
        </button>

        {/* Option 2 — email */}
        <div
          style={{
            padding: '16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', color: 'var(--white)', marginBottom: '4px' }}>
            ✉️ Submit via email
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
            Send claim details to this address. Attach any documents.
          </div>
          {intakeEmail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--white)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {intakeEmail}
              </div>
              <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--faint)' }}>
              No intake email configured yet. Contact your firm admin.
            </div>
          )}
        </div>

        {/* Option 3 — call */}
        <div
          style={{
            padding: '16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', color: 'var(--white)', marginBottom: '4px' }}>
            📞 Call us
          </div>
          {firmPhone ? (
            <>
              <div style={{ fontSize: '12px', color: 'var(--white)', marginBottom: '6px', fontWeight: 600 }}>
                {firmPhone}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--faint)' }}>
                Mon–Fri, 8am–6pm CT
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Phone support coming soon — check back for hours and contact info.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
