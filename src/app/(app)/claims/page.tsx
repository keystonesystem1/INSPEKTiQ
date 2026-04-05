import { PageHeader } from '@/components/layout/PageHeader';
import { ClaimsList } from '@/components/claims/ClaimsList';
import { NewClaimButton } from '@/components/claims/NewClaimButton';
import { getClaims } from '@/lib/supabase/claims';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { canCreateClaims } from '@/lib/utils/roles';

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const { id, role, firmId } = await requireAuthenticatedFirmUser();
  const archivedView = view === 'archived' && ['firm_admin', 'super_admin'].includes(role);
  const claims = await getClaims(firmId, role, id, { archived: archivedView });

  return (
    <div>
      <PageHeader
        title="Claims"
        subtitle="Status filters, SLA indicators, and role-aware claim visibility."
        actions={canCreateClaims(role) ? <NewClaimButton /> : undefined}
      />
      <ClaimsList role={role} claims={claims} archivedView={archivedView} />
    </div>
  );
}
