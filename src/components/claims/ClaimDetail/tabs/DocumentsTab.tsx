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
  const photoSections = documents.photos.reduce<Record<string, typeof documents.photos>>((accumulator, photo) => {
    accumulator[photo.section] ??= [];
    accumulator[photo.section].push(photo);
    return accumulator;
  }, {});

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
          Reports
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

      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
          Photos
        </div>
        {documents.photos.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>No documents uploaded.</div>
        ) : (
          Object.entries(photoSections).map(([section, photos]) => (
            <div key={section} style={{ paddingBottom: '16px' }}>
              <div style={{ marginBottom: '10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {section}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {photos.map((photo) => (
                  <a
                    key={photo.path}
                    href={photo.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'grid', gap: '8px', color: 'inherit', textDecoration: 'none' }}
                  >
                    <img
                      src={photo.signedUrl}
                      alt={photo.filename}
                      style={{
                        width: '100%',
                        aspectRatio: '4 / 3',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    />
                    <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{photo.filename}</div>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
