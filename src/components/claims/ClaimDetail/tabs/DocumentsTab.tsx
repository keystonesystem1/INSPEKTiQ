import { Card } from '@/components/ui/Card';
import type { ClaimDocuments } from '@/lib/supabase/documents';

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

export function DocumentsTab({ documents }: { documents: ClaimDocuments }) {
  return (
    <Card>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
        Documents
      </div>
      {documents.reports.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>No reports uploaded.</div>
      ) : (
        documents.reports.map((report) => (
          <div key={report.path} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{report.filename}</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{formatTimestamp(report.createdAt)}</div>
            </div>
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
              Download
            </a>
          </div>
        ))
      )}
    </Card>
  );
}
