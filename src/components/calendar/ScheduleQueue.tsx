'use client';

import { demoClaims } from '@/lib/utils/demo-data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function ScheduleQueue({
  onStartSchedule,
}: {
  onStartSchedule: (claimId: string) => void;
}) {
  return (
    <div style={{ width: '280px', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Needs Scheduling Queue</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Sorted by SLA urgency</div>
      </div>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {['All', 'SLA Risk', 'Residential', 'Commercial'].map((label, index) => (
          <button key={label} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: index === 0 ? 'var(--sage-dim)' : 'transparent', color: index === 0 ? 'var(--sage)' : 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {demoClaims.map((claim) => (
          <div key={claim.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', claim.id)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'grab' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong>{claim.insured}</strong>
              <Badge tone={claim.slaHoursRemaining < 0 ? 'red' : claim.slaHoursRemaining < 48 ? 'orange' : 'blue'}>{claim.slaHoursRemaining < 0 ? 'Overdue' : 'At Risk'}</Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '6px' }}>{claim.address}</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button size="sm" onClick={() => onStartSchedule(claim.id)}>Schedule</Button>
              <Button size="sm" variant="ghost">First Contact</Button>
              <Button size="sm" variant="ghost">···</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
