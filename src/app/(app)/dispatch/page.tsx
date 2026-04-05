import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { getClaims } from '@/lib/supabase/claims';
import { getDispatchAdjusters } from '@/lib/supabase/adjusters';
import { PageHeader } from '@/components/layout/PageHeader';
import { DispatchMap } from '@/components/dispatch/DispatchMap';

export default async function DispatchPage() {
  const { firmId, role, id: userId } = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'dispatcher', 'super_admin'].includes(role)) {
    redirect('/dashboard');
  }

  const [allClaims, adjusters] = await Promise.all([
    getClaims(firmId, role, userId),
    getDispatchAdjusters(firmId),
  ]);

  const claims = allClaims.filter(
    (claim) => !['closed', 'submitted'].includes(claim.status),
  );

  return (
    <div>
      <PageHeader title="Dispatch" subtitle="Three-panel dispatch surface with claims, lasso selection, map, and adjuster roster." />
      <DispatchMap claims={claims} adjusters={adjusters} />
    </div>
  );
}
