import { PageHeader } from '@/components/layout/PageHeader';
import { ClaimsList } from '@/components/claims/ClaimsList';
import { Button } from '@/components/ui/Button';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { canCreateClaims } from '@/lib/utils/roles';

export default async function ClaimsPage() {
  const { role } = await requireAuthenticatedFirmUser();

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
