import type { Role } from '@/lib/types';

export { type Role } from '@/lib/types';

export const ROLE_TABS: Record<Role, string[]> = {
  super_admin: ['dashboard', 'claims', 'clients', 'dispatch', 'adjusters', 'calendar', 'billing', 'settings'],
  firm_admin: ['dashboard', 'claims', 'clients', 'dispatch', 'adjusters', 'billing', 'settings'],
  examiner: ['dashboard', 'claims', 'billing'],
  dispatcher: ['dashboard', 'claims', 'dispatch'],
  adjuster: ['dashboard', 'claims', 'calendar'],
  carrier: ['dashboard', 'claims'],
  carrier_admin: ['dashboard', 'claims'],
  carrier_desk_adjuster: ['dashboard', 'claims'],
};

export const canCreateClaims = (role: Role) => ['firm_admin', 'dispatcher', 'super_admin'].includes(role);
export const canAssignClaims = (role: Role) => ['firm_admin', 'dispatcher', 'super_admin'].includes(role);
export const canApproveClaims = (role: Role) => ['firm_admin', 'examiner', 'super_admin'].includes(role);
export const canViewBilling = (role: Role) => ['firm_admin', 'examiner', 'super_admin'].includes(role);
export const canViewSettings = (role: Role) => ['firm_admin', 'super_admin'].includes(role);

export function getRoleFromCookie(value?: string | null): Role | null {
  if (!value) {
    return null;
  }

  return (Object.keys(ROLE_TABS) as Role[]).find((role) => role === value) ?? null;
}

export function canAccessTab(role: Role, tab: string) {
  return ROLE_TABS[role].includes(tab);
}
