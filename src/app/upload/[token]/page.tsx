'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

interface TokenInfo {
  tokenId: string;
  claimId: string;
  recipientName: string | null;
  insuredName: string;
  claimNumber: string;
  lossAddress: string;
  expiresAt: string;
}

type Status = 'loading' | 'invalid' | 'expired' | 'ready' | 'uploading' | 'done' | 'error';

interface UploadedFile {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export default function UploadPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [status, setStatus] = useState<Status>('loading');
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!token) return;
    const supabase = createClient();
    void (async () => {
      const { data, error: tokenError } = await supabase
        .from('upload_tokens')
        .select('id, claim_id, recipient_name, expires_at, claims:claim_id(insured_name, claim_number, loss_address)')
        .eq('token', token)
        .maybeSingle<{
          id: string;
          claim_id: string;
          recipient_name: string | null;
          expires_at: string;
          claims: { insured_name: string | null; claim_number: string | null; loss_address: string | null } | null;
        }>();

      if (tokenError || !data) {
        setStatus('invalid');
        setError('This upload link is invalid or has been removed.');
        return;
      }

      if (new Date(data.expires_at).getTime() < Date.now()) {
        setStatus('expired');
        setError('This upload link has expired.');
        return;
      }

      setInfo({
        tokenId: data.id,
        claimId: data.claim_id,
        recipientName: data.recipient_name,
        insuredName: data.claims?.insured_name ?? 'Claim',
        claimNumber: data.claims?.claim_number ?? '',
        lossAddress: data.claims?.loss_address ?? '',
        expiresAt: data.expires_at,
      });
      setStatus('ready');
    })();
  }, [token]);

  const uploadOne = useCallback(
    async (file: File, index: number) => {
      if (!info) return;
      setFiles((current) => current.map((entry, i) => (i === index ? { ...entry, status: 'uploading' } : entry)));
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('claimId', info.claimId);
      formData.append('token', token);
      formData.append('filename', file.name);
      try {
        const response = await fetch('/api/upload-document', { method: 'POST', body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? 'Upload failed.');
        }
        setFiles((current) => current.map((entry, i) => (i === index ? { ...entry, status: 'done' } : entry)));
      } catch (caught) {
        setFiles((current) =>
          current.map((entry, i) =>
            i === index
              ? { ...entry, status: 'error', error: caught instanceof Error ? caught.message : 'Upload failed.' }
              : entry,
          ),
        );
      }
    },
    [info, token],
  );

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (!list.length) return;
      setFiles((current) => {
        const startIndex = current.length;
        const next = [
          ...current,
          ...list.map((file) => ({ name: file.name, status: 'pending' as const })),
        ];
        // Kick off uploads after state settles.
        setTimeout(() => {
          list.forEach((file, i) => void uploadOne(file, startIndex + i));
        }, 0);
        return next;
      });
    },
    [uploadOne],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer?.files?.length) {
        void handleFiles(event.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px' }}>
      <Card
        style={{
          width: 'min(640px, 100%)',
          padding: '32px',
          background: 'linear-gradient(180deg, rgba(22, 33, 48, 0.94), rgba(15, 25, 35, 0.98))',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '0.04em',
              marginBottom: '14px',
            }}
          >
            <span style={{ color: 'var(--white)' }}>INSPEKT</span>
            <span style={{ color: 'var(--sage)' }}>iQ</span>
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '22px', margin: 0 }}>
            Upload Documents
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
            {info ? `For ${info.insuredName}${info.claimNumber ? ` · ${info.claimNumber}` : ''}` : 'Secure document upload'}
          </p>
          {info?.lossAddress ? (
            <p style={{ margin: '4px 0 0', color: 'var(--faint)', fontSize: '12px' }}>{info.lossAddress}</p>
          ) : null}
        </div>

        {status === 'loading' ? <p style={{ color: 'var(--muted)' }}>Loading...</p> : null}

        {status === 'invalid' || status === 'expired' ? (
          <p style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</p>
        ) : null}

        {status === 'ready' || status === 'uploading' || status === 'done' ? (
          <>
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--sage)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                textAlign: 'center',
                background: dragging ? 'rgba(91,194,115,0.06)' : 'var(--card)',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', color: 'var(--white)', marginBottom: '6px' }}>
                Drag files here to upload
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '14px' }}>or</div>
              <label>
                <input
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(event) => event.target.files && void handleFiles(event.target.files)}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--sage)',
                    color: '#06120C',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 800,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Choose Files
                </span>
              </label>
            </div>

            {files.length > 0 ? (
              <div style={{ marginTop: '18px', display: 'grid', gap: '8px' }}>
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '11px', color: file.status === 'done' ? 'var(--sage)' : file.status === 'error' ? 'var(--red)' : 'var(--muted)' }}>
                      {file.status === 'pending' ? 'Queued' : null}
                      {file.status === 'uploading' ? 'Uploading...' : null}
                      {file.status === 'done' ? 'Uploaded' : null}
                      {file.status === 'error' ? file.error ?? 'Failed' : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <p style={{ marginTop: '18px', color: 'var(--faint)', fontSize: '11px' }}>
              Link expires {info ? new Date(info.expiresAt).toLocaleDateString() : ''}.
            </p>
          </>
        ) : null}
      </Card>
    </main>
  );
}
