import { cookies } from 'next/headers';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClaimsList } from '@/components/claims/ClaimsList';
import { Button } from '@/components/ui/Button';
import { canCreateClaims, getRoleFromCookie } from '@/lib/utils/roles';

export default async function ClaimsPage() {
  const cookieStore = await cookies();
  const role = getRoleFromCookie(cookieStore.get('inspektiq-role')?.value) ?? 'firm_admin';

  return (
    <div>
      <PageHeader
        title="Claims"
        subtitle="Status filters, SLA indicators, and role-aware claim visibility."
        actions={canCreateClaims(role) ? <Button>New Claim</Button> : undefined}
      />
      <ClaimsList role={role} />
    </div>
  );
}
