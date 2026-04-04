import { addHours, differenceInHours, parseISO } from 'date-fns';
import type { Claim } from '@/lib/types';

export const DEFAULT_SLA = {
  received_to_assigned: 24,
  assigned_to_contacted: 48,
  contacted_to_inspection: 120,
  inspection_to_report: 120,
  report_to_approval: 72,
};

export function getSLADueDate(claim: Claim, thresholds = DEFAULT_SLA): Date {
  const start = claim.milestones.received ?? claim.dateOfLoss;
  return addHours(parseISO(start), thresholds.received_to_assigned);
}

export function getSLAHoursRemaining(claim: Claim, thresholds = DEFAULT_SLA): number {
  return differenceInHours(getSLADueDate(claim, thresholds), new Date());
}

export function getSLAStatus(
  claim: Claim,
  thresholds = DEFAULT_SLA,
): 'ok' | 'warning' | 'overdue' {
  const hoursRemaining = getSLAHoursRemaining(claim, thresholds);

  if (hoursRemaining < 0) {
    return 'overdue';
  }

  if (hoursRemaining <= 48) {
    return 'warning';
  }

  return 'ok';
}
