import type { Claim, TimelineItem, BadgeTone } from '@/lib/types';

const MILESTONE_LABELS: Record<string, { action: string; tone: BadgeTone }> = {
  received:             { action: 'Claim received',              tone: 'blue' },
  assigned:             { action: 'Adjuster assigned',           tone: 'blue' },
  accepted:             { action: 'Claim accepted by adjuster',  tone: 'blue' },
  contact_attempted:    { action: 'Contact attempted',           tone: 'orange' },
  contacted:            { action: 'Insured contacted',           tone: 'sage' },
  scheduled:            { action: 'Inspection scheduled',        tone: 'sage' },
  inspection_started:   { action: 'Inspection started',         tone: 'sage' },
  inspection_completed: { action: 'Inspection completed',        tone: 'sage' },
  in_review:            { action: 'Report in review',            tone: 'orange' },
  approved:             { action: 'Report approved',             tone: 'sage' },
  submitted:            { action: 'Submitted to carrier',        tone: 'sage' },
  closed:               { action: 'Claim closed',                tone: 'faint' },
};

export function buildSyntheticTimeline(claim: Claim): TimelineItem[] {
  const items: TimelineItem[] = [];
  const milestones = claim.milestones ?? {};

  for (const [key, ts] of Object.entries(milestones)) {
    const def = MILESTONE_LABELS[key];
    if (!def || !ts) continue;
    const date = new Date(ts);
    items.push({
      id: key,
      tone: def.tone,
      action: def.action,
      who: key === 'assigned' && claim.adjuster ? claim.adjuster : '—',
      timestamp: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'created',
      tone: 'faint',
      action: 'Claim created',
      who: '—',
      timestamp: claim.dateOfLoss
        ? new Date(claim.dateOfLoss).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—',
    });
  }

  return items.sort((a, b) => b.id.localeCompare(a.id));
}
