import { Modal } from '@/components/ui/Modal';
import { demoAdjusters, demoClaims } from '@/lib/utils/demo-data';
import { Badge } from '@/components/ui/Badge';

export function AssignModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Assign Selected Claims" subtitle="Review selected claims and choose an adjuster.">
      <div style={{ marginBottom: '14px' }}>
        <div style={{ marginBottom: '8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Selected Claims</div>
        {demoClaims.slice(0, 2).map((claim) => (
          <div key={claim.id} style={{ display: 'flex', gap: '10px', padding: '7px 10px', background: 'var(--card)', borderRadius: '5px', marginBottom: '4px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'var(--sage)', display: 'grid', placeItems: 'center', color: '#06120C', fontSize: '8px' }}>✓</div>
            <div style={{ flex: 1 }}>{claim.insured}</div>
            <Badge tone="faint">{claim.category}</Badge>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {demoAdjusters.map((adjuster) => (
          <div key={adjuster.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 500 }}>{adjuster.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>{adjuster.location}</div>
            <div style={{ marginTop: '8px' }}>
              <Badge tone={adjuster.activeClaims >= adjuster.maxClaims ? 'orange' : 'blue'}>
                {adjuster.activeClaims >= adjuster.maxClaims ? '1 issue' : 'Ready'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
