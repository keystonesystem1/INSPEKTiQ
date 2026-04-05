import { PageHeader } from '@/components/layout/PageHeader';
import { ClaimsList } from '@/components/claims/ClaimsList';
import { NewClaimButton } from '@/components/claims/NewClaimButton';
import { getClaims } from '@/lib/supabase/claims';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { canCreateClaims } from '@/lib/utils/roles';

export default async function ClaimsPage() {
  const { id, role, firmId } = await requireAuthenticatedFirmUser();
  const claims = await getClaims(firmId, role, id);

  return (
    <div>
      <PageHeader
        title="Claims"
        subtitle="Status filters, SLA indicators, and role-aware claim visibility."
        actions={canCreateClaims(role) ? <NewClaimButton /> : undefined}
      />
      <ClaimsList role={role} claims={claims} />
    </div>
  );
}
