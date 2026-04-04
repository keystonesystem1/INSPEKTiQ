'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import type { ClaimDocuments } from '@/lib/supabase/documents';

function formatSectionName(section: string) {
  if (section === 'personal_property') return 'Personal Property';
  if (section === 'interior') return 'Interior';

  return section
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PhotosTab({ documents }: { documents: ClaimDocuments }) {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const photoSections = documents.photos.reduce<Record<string, typeof documents.photos>>((accumulator, photo) => {
    accumulator[photo.section] ??= [];
    accumulator[photo.section].push(photo);
    return accumulator;
  }, {});
  const gridColumns =
    size === 'small'
      ? 'repeat(6, minmax(0, 1fr))'
      : size === 'large'
        ? 'repeat(2, minmax(0, 1fr))'
        : 'repeat(4, minmax(0, 1fr))';

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Pill label="Small" active={size === 'small'} onClick={() => setSize('small')} />
        <Pill label="Medium" active={size === 'medium'} onClick={() => setSize('medium')} />
        <Pill label="Large" active={size === 'large'} onClick={() => setSize('large')} />
      </div>

      {documents.photos.length === 0 ? (
        <Card>
          <div style={{ color: 'var(--muted)' }}>No photos uploaded.</div>
        </Card>
      ) : null}

      {Object.entries(photoSections).map(([section, photos]) => (
        <Card key={section}>
          <div style={{ marginBottom: '12px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {formatSectionName(section)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '12px' }}>
            {photos.map((photo, index) => (
              <a
                key={photo.path}
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
                <div style={{ display: 'grid', gap: '2px', fontSize: '11px' }}>
                  <div style={{ color: 'var(--white)' }}>{`${index + 1}. ${photo.label}`}</div>
                  {photo.caption ? <div style={{ color: 'var(--muted)' }}>{photo.caption}</div> : null}
                </div>
              </a>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
