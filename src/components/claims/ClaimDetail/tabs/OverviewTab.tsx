import { Card } from '@/components/ui/Card';
import type { Claim, Role } from '@/lib/types';

const CARRIER_ROLES = new Set<Role>(['carrier', 'carrier_admin', 'carrier_desk_adjuster']);

function formatLocation(city: string, state: string) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return '-';
}

export function OverviewTab({ claim, role, documentCount }: { claim: Claim; role: Role; documentCount: number }) {
  const isCarrierRole = CARRIER_ROLES.has(role);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isCarrierRole ? 3 : 4}, minmax(0, 1fr))`, gap: '12px' }}>
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Claim Status + SLA</div><div style={{ marginTop: '8px' }}>{claim.status.replace('_', ' ')}</div></Card>
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Key Contacts</div><div style={{ marginTop: '8px' }}>Insured, adjuster, examiner</div></Card>
        {!isCarrierRole ? (
          <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Reserves Total</div><div style={{ marginTop: '8px' }}>${claim.reserveTotal.toLocaleString()}</div></Card>
        ) : null}
        <Card><div style={{ color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>Recent Documents</div><div style={{ marginTop: '8px' }}>{documentCount} documents</div></Card>
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
            ['City', formatLocation(claim.city, claim.state)],
            ['Special Instructions', '-'],
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
