'use client';

import { useState } from 'react';

const INTAKE_EMAIL = process.env.NEXT_PUBLIC_FIRM_INTAKE_EMAIL ?? 'intake+e79f863e@parse.keystonestack.com';

export function IntakeEmailBanner() {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(INTAKE_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        marginBottom: '14px',
        borderRadius: '8px',
        background: 'rgba(91,194,115,0.07)',
        border: '1px solid rgba(91,194,115,0.2)',
        fontSize: '12px',
        color: 'var(--muted)',
      }}
    >
      <span>Email claims to</span>
      <strong style={{ fontFamily: 'monospace', color: 'var(--white)' }}>{INTAKE_EMAIL}</strong>
      <button
        onClick={copy}
        style={{
          marginLeft: '4px',
          padding: '2px 8px',
          borderRadius: '5px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: copied ? 'var(--sage)' : 'var(--muted)',
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
