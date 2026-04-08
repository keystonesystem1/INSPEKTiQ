'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { SendUploadLinkModal } from '@/components/claims/ClaimDetail/SendUploadLinkModal';
import type { ClaimDocuments } from '@/lib/supabase/documents';
import type { Role } from '@/lib/types';

const UPLOAD_LINK_ROLES = new Set<Role>([
  'firm_admin',
  'super_admin',
  'dispatcher',
  'adjuster',
  'carrier_admin',
  'carrier_desk_adjuster',
]);

function formatTimestamp(value?: string) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function canShareDocuments(role: Role) {
  return role === 'firm_admin' || role === 'examiner';
}

export function DocumentsTab({
  claimId,
  role,
  documents,
}: {
  claimId: string;
  role: Role;
  documents: ClaimDocuments;
}) {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadLinkOpen, setUploadLinkOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const shareEnabled = canShareDocuments(role);
  const uploadLinkEnabled = UPLOAD_LINK_ROLES.has(role);
  const hasSelection = selectedPaths.length > 0;

  const selectedSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);

  return (
    <Card>
      <div style={{ display: 'grid', gap: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Documents
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {uploadLinkEnabled ? (
              <Button size="sm" variant="ghost" onClick={() => setUploadLinkOpen(true)}>
                Send Upload Link
              </Button>
            ) : null}
            {shareEnabled ? (
              <Button size="sm" disabled={!hasSelection || sending}>
                Share Documents
              </Button>
            ) : null}
          </div>
        </div>

        {shareEnabled && hasSelection ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            <FormInput label="Recipient Email" value={recipientEmail} onChange={setRecipientEmail} placeholder="name@example.com" />
            <FormInput label="Recipient Name (Optional)" value={recipientName} onChange={setRecipientName} placeholder="Recipient name" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: message.includes('sent') ? 'var(--sage)' : 'var(--muted)', fontSize: '12px' }}>
                {message}
              </div>
              <Button
                size="sm"
                disabled={sending || !recipientEmail.trim()}
                onClick={async () => {
                  setSending(true);
                  setMessage('');

                  const response = await fetch(`/api/claims/${claimId}/share`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      documentPaths: selectedPaths,
                      recipientEmail: recipientEmail.trim(),
                      recipientName: recipientName.trim() || undefined,
                    }),
                  });

                  const payload = (await response.json().catch(() => ({}))) as { error?: string };

                  if (!response.ok) {
                    setMessage(payload.error ?? 'Unable to send share link.');
                    setSending(false);
                    return;
                  }

                  setMessage(`Share link sent to ${recipientEmail.trim()}`);
                  setSelectedPaths([]);
                  setRecipientEmail('');
                  setRecipientName('');
                  setSending(false);
                }}
              >
                {sending ? 'Sending' : 'Send Share Link'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      {documents.reports.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No reports uploaded.</div>
      ) : (
        documents.reports.map((report) => (
          <div key={report.path} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {shareEnabled ? (
                <input
                  type="checkbox"
                  checked={selectedSet.has(report.path)}
                  onChange={(event) => {
                    setMessage('');
                    setSelectedPaths((current) =>
                      event.target.checked
                        ? [...current, report.path]
                        : current.filter((path) => path !== report.path),
                    );
                  }}
                />
              ) : null}
              <div>
                <div style={{ fontWeight: 600 }}>{report.filename}</div>
                <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{formatTimestamp(report.createdAt)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={report.signedUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--sage)',
                }}
              >
                Preview
              </a>
              <a
                href={report.signedUrl}
                download={report.filename}
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--sage)',
                }}
              >
                Download
              </a>
            </div>
          </div>
        ))
      )}
      <SendUploadLinkModal
        open={uploadLinkOpen}
        onClose={() => setUploadLinkOpen(false)}
        claimId={claimId}
        onSent={(m) => setToast(m)}
      />
      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 16px',
            background: 'var(--sage-dim)',
            color: 'var(--sage)',
            border: '1px solid rgba(91,194,115,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            zIndex: 300,
            boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </Card>
  );
}
