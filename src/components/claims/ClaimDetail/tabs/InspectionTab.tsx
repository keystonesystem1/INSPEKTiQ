import { Card } from '@/components/ui/Card';
import type { ClaimInspectionData } from '@/lib/supabase/inspections';

function formatInspectionTimestamp(value: string) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function InspectionTab({ inspection }: { inspection: ClaimInspectionData }) {
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {inspection.inspection ? (
        <Card style={{ background: 'var(--surface)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Inspection Record
          </div>
          <div style={{ marginTop: '10px', color: 'var(--muted)' }}>
            {`Captured ${formatInspectionTimestamp(inspection.inspection.createdAt)} via INSPEKTiT.`}
          </div>
        </Card>
      ) : null}

      {inspection.sections.length === 0 ? (
        <Card style={{ background: 'var(--surface)' }}>
          <div style={{ color: 'var(--muted)' }}>No inspection data available yet.</div>
        </Card>
      ) : null}

      {inspection.sections.map((section) => (
        <Card key={section.section} style={{ background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{section.section}</div>
            <span style={{ color: 'var(--muted)' }}>{`${section.photos.length} photo${section.photos.length === 1 ? '' : 's'}`}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '12px' }}>
            {section.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.signedUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'grid', gap: '8px', color: 'inherit', textDecoration: 'none' }}
              >
                <img
                  src={photo.signedUrl}
                  alt={photo.label}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                />
                <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                  <div style={{ color: 'var(--white)' }}>{photo.label}</div>
                  {photo.caption ? <div>{photo.caption}</div> : null}
                </div>
              </a>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
