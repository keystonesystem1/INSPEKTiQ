import type { Role } from '@/lib/types';

export type CardSize = 'half' | 'full';

export interface CardDefinition {
  id: string;
  label: string;
  defaultSize: CardSize;
  allowedSizes: CardSize[];
  /** If true, size toggle and hide button are suppressed */
  locked: boolean;
  defaultVisible: boolean;
}

export interface CardLayoutItem {
  id: string;
  size: CardSize;
  visible: boolean;
}

// ── Card registries per role ─────────────────────────────────────────────────

const ADMIN_CARDS: CardDefinition[] = [
  { id: 'stats',      label: 'Stats Overview',    defaultSize: 'full', allowedSizes: ['full'],        locked: true,  defaultVisible: true },
  { id: 'sla_alerts', label: 'SLA Alerts',        defaultSize: 'half', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
  { id: 'unassigned', label: 'Unassigned Claims', defaultSize: 'half', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
  { id: 'activity',   label: 'Recent Activity',   defaultSize: 'full', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
];

const ADJUSTER_CARDS: CardDefinition[] = [
  { id: 'stats',          label: 'My Stats',          defaultSize: 'full', allowedSizes: ['full'],        locked: true,  defaultVisible: true },
  { id: 'active_claims',  label: 'Active Claims',     defaultSize: 'full', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
  { id: 'today_schedule', label: "Today's Schedule",  defaultSize: 'half', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
];

const DISPATCHER_CARDS: CardDefinition[] = [
  { id: 'stats',            label: 'Dispatch Stats',       defaultSize: 'full', allowedSizes: ['full'],        locked: true,  defaultVisible: true },
  { id: 'unassigned_queue', label: 'Unassigned Queue',     defaultSize: 'full', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
  { id: 'availability',     label: 'Adjuster Availability',defaultSize: 'half', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
];

const EXAMINER_CARDS: CardDefinition[] = [
  { id: 'stats',        label: 'Examiner Stats', defaultSize: 'full', allowedSizes: ['full'],        locked: true,  defaultVisible: true },
  { id: 'review_queue', label: 'Review Queue',   defaultSize: 'full', allowedSizes: ['half', 'full'], locked: false, defaultVisible: true },
];

const CARD_REGISTRY: Partial<Record<Role, CardDefinition[]>> = {
  firm_admin:  ADMIN_CARDS,
  super_admin: ADMIN_CARDS,
  adjuster:    ADJUSTER_CARDS,
  dispatcher:  DISPATCHER_CARDS,
  examiner:    EXAMINER_CARDS,
};

export function getCardDefs(role: Role): CardDefinition[] {
  return CARD_REGISTRY[role] ?? [];
}

/** Build the default layout for a role from the registry. */
export function defaultLayout(role: Role): CardLayoutItem[] {
  return getCardDefs(role).map((def) => ({
    id: def.id,
    size: def.defaultSize,
    visible: def.defaultVisible,
  }));
}

/**
 * Merge a saved layout (from DB) with the current role registry.
 * - New cards added to the registry are appended at the end.
 * - Cards removed from the registry are dropped.
 * - Saved size is validated against allowedSizes; falls back to default.
 */
export function mergeLayout(
  saved: CardLayoutItem[],
  role: Role,
): CardLayoutItem[] {
  const defs = getCardDefs(role);
  if (!defs.length) return [];

  const defById = new Map(defs.map((d) => [d.id, d]));
  const savedById = new Map(saved.map((s) => [s.id, s]));

  // Keep saved order, filtered to valid IDs
  const merged: CardLayoutItem[] = saved
    .filter((s) => defById.has(s.id))
    .map((s) => {
      const def = defById.get(s.id)!;
      const size = def.allowedSizes.includes(s.size) ? s.size : def.defaultSize;
      return { id: s.id, size, visible: s.visible };
    });

  // Append any new cards from the registry that weren't in saved
  for (const def of defs) {
    if (!savedById.has(def.id)) {
      merged.push({ id: def.id, size: def.defaultSize, visible: def.defaultVisible });
    }
  }

  return merged;
}
