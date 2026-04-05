import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveDocumentUrl } from '@/lib/supabase/documents';

interface ClaimShareRow {
  claim_id: string;
  document_paths: string[];
  expires_at: string;
}

interface ClaimRow {
  claim_number: string | null;
  insured_name: string | null;
}

function formatExpiration(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: share } = await supabase
    .from('claim_shares')
    .select('claim_id, document_paths, expires_at')
    .eq('token', token)
    .maybeSingle<ClaimShareRow>();

  if (!share || new Date(share.expires_at).getTime() < Date.now()) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px', background: 'var(--bg)', color: 'var(--white)' }}>
        <div style={{ textAlign: 'center', maxWidth: '520px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', marginBottom: '14px' }}>
            <span style={{ color: 'var(--white)' }}>INSPEKT</span>
            <span style={{ color: 'var(--sage)' }}>iQ</span>
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '0.04em', margin: 0 }}>Link expired or not found</h1>
          <p style={{ color: 'var(--muted)' }}>This share link is no longer available.</p>
        </div>
      </main>
    );
  }

  const { data: claim } = await supabase
    .from('claims')
    .select('claim_number, insured_name')
    .eq('id', share.claim_id)
    .maybeSingle<ClaimRow>();

  const documents = await Promise.all(
    (share.document_paths ?? []).map(async (path) => ({
      path,
      filename: path.split('/').pop() ?? path,
      url: await resolveDocumentUrl(path),
    })),
  );

  const validDocuments = documents.filter((document) => document.url);

  return (
    <main style={{ minHeight: '100vh', padding: '40px 24px', background: 'var(--bg)', color: 'var(--white)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', marginBottom: '14px' }}>
            <span style={{ color: 'var(--white)' }}>INSPEKT</span>
            <span style={{ color: 'var(--sage)' }}>iQ</span>
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '0.04em', margin: 0 }}>
            {`Documents for Claim ${claim?.claim_number ?? 'Claim'} — ${claim?.insured_name ?? 'Insured'}`}
          </h1>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', background: 'var(--surface)', padding: '20px 24px' }}>
          {validDocuments.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>No documents available.</div>
          ) : (
            validDocuments.map((document) => (
              <div key={document.path} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{document.filename}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href={document.url!}
                    target="_blank"
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--sage)',
                      textDecoration: 'none',
                    }}
                  >
                    Preview
                  </Link>
                  <a
                    href={document.url!}
                    download={document.filename}
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--sage)',
                      textDecoration: 'none',
                    }}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '18px', color: 'var(--muted)', fontSize: '12px' }}>
          {`This link expires on ${formatExpiration(share.expires_at)}.`}
        </div>
      </div>
    </main>
  );
}
