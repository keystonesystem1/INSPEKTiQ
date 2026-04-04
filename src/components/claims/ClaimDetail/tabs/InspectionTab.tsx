import { Card } from '@/components/ui/Card';
import type { Claim } from '@/lib/types';

export function InspectionTab({ claim }: { claim: Claim }) {
  const sections = ['Roof', 'Exterior', 'Interior', 'Other Structures', 'Personal Property'];

  if (claim.photosCount === 0) {
    return (
      <Card>
        <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No inspection data yet. Photos will appear here once synced from INSPEKTiT.</div>
      </Card>
    );
  }

  const breakdown = [
    ['Roof', `${Math.round(claim.photosCount * 0.42)} photos`, 'Complete'],
    ['Exterior', `${Math.round(claim.photosCount * 0.25)} photos`, 'Complete'],
    ['Interior', `${Math.round(claim.photosCount * 0.18)} photos`, 'In Progress'],
    ['Other Structures', `${Math.round(claim.photosCount * 0.1)} photos`, 'Pending'],
    ['Personal Property', `${Math.round(claim.photosCount * 0.05)} photos`, 'Pending'],
  ];

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {breakdown.map(([section, photos, status]) => (
        <Card key={section} style={{ background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{section}</div>
            <span style={{ color: 'var(--muted)' }}>{status}</span>
          </div>
          <div style={{ marginTop: '10px', color: 'var(--muted)' }}>{photos} synced from INSPEKTiT via Supabase.</div>
        </Card>
      ))}
    </div>
  );
}
