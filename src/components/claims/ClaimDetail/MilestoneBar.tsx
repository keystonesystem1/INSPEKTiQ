import type { Claim, MilestoneKey } from '@/lib/types';

const stages: Array<{ key: MilestoneKey; label: string }> = [
  { key: 'received', label: 'Received' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'inspected', label: 'Inspected' },
  { key: 'in_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'closed', label: 'Closed' },
];

export function MilestoneBar({ claim }: { claim: Claim }) {
  const currentIndex = stages.findIndex((stage) => !claim.milestones[stage.key]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0 18px', gap: 0 }}>
      {stages.map((stage, index) => {
        const done = Boolean(claim.milestones[stage.key]) && (currentIndex === -1 || index < currentIndex);
        const current = !done && index === currentIndex;

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
