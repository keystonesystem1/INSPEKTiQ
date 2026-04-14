import type { Claim, MilestoneKey } from '@/lib/types';

const stages: Array<{ key: MilestoneKey; label: string }> = [
  { key: 'received', label: 'Received' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'contact_attempted', label: 'Contact attempted' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'inspection_started', label: 'Inspection started' },
  { key: 'inspection_completed', label: 'Inspection completed' },
  { key: 'in_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'closed', label: 'Closed' },
];

function getStageKeyFromStatus(status: Claim['status']): MilestoneKey {
  switch (status) {
    case 'assigned':
      return 'assigned';
    case 'accepted':
      return 'accepted';
    case 'contact_attempted':
      return 'contact_attempted';
    case 'contacted':
      return 'contacted';
    case 'scheduled':
      return 'scheduled';
    case 'inspection_started':
      return 'inspection_started';
    case 'inspection_completed':
      return 'inspection_completed';
    case 'in_review':
    case 'pending_te':
    case 'pending_carrier_direction':
    case 'pending_engineer':
    case 'on_hold':
      return 'in_review';
    case 'needs_attention':
      return 'received';
    case 'approved':
      return 'approved';
    case 'submitted':
      return 'submitted';
    case 'closed':
      return 'closed';
    case 'received':
    default:
      return 'received';
  }
}

export function MilestoneBar({ claim }: { claim: Claim }) {
  const currentStage = getStageKeyFromStatus(claim.status);
  const currentIndex = stages.findIndex((stage) => stage.key === currentStage);

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0 18px', gap: 0 }}>
      {stages.map((stage, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;

        return (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'grid', justifyItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: `2px solid ${done ? 'var(--sage)' : current ? 'var(--orange)' : 'var(--border)'}`,
                  background: done ? 'var(--sage)' : current ? 'var(--orange-dim)' : 'var(--bg)',
                  color: done ? '#06120C' : current ? 'var(--orange)' : 'var(--faint)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800,
                  fontSize: '9px',
                }}
              >
                {done ? '✓' : '•'}
              </div>
              <div style={{ marginTop: '4px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.07em', textTransform: 'uppercase', color: done ? 'var(--sage)' : current ? 'var(--orange)' : 'var(--faint)' }}>
                {stage.label}
              </div>
            </div>
            {index < stages.length - 1 ? <div style={{ height: '2px', flex: 1, background: done ? 'var(--sage)' : 'var(--border)', marginBottom: '20px' }} /> : null}
          </div>
        );
      })}
    </div>
  );
}
