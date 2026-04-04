import { Card } from '@/components/ui/Card';
import type { Claim } from '@/lib/types';

export function OverviewTab({ claim }: { claim: Claim }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Claim Status + SLA</div><div style={{ marginTop: '8px' }}>{claim.status.replace('_', ' ')}</div></Card>
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Key Contacts</div><div style={{ marginTop: '8px' }}>Insured, adjuster, examiner</div></Card>
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Reserves Total</div><div style={{ marginTop: '8px' }}>${claim.reserveTotal.toLocaleString()}</div></Card>
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Recent Documents</div><div style={{ marginTop: '8px' }}>{claim.photosCount} synced assets</div></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Card>
          <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', marginBottom: '12px' }}>Claim Details</div>
          {[
            ['Policy Number', claim.policyNumber],
            ['Loss Cause', claim.lossCause],
            ['Claim Type', claim.type],
            ['Client', claim.client],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{label}</span><strong>{value}</strong>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', marginBottom: '12px' }}>Insured Information</div>
          {[
            ['Name', claim.insured],
            ['Address', claim.address],
            ['City', `${claim.city}, ${claim.state}`],
            ['Special Instructions', 'Review detached structures before wrap-up.'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>{label}</span><strong style={{ textAlign: 'right' }}>{value}</strong>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
