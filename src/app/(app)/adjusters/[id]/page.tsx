import { notFound, redirect } from 'next/navigation';
import { AdjusterProfile } from '@/components/adjusters/AdjusterProfile';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAdjusterById, getCarrierOptionsForFirmAdmin } from '@/lib/supabase/adjusters';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function AdjusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const firmUser = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    redirect('/dashboard');
  }

  const [adjuster, carrierOptions] = await Promise.all([
    getAdjusterById(firmUser.firmId, id),
    getCarrierOptionsForFirmAdmin(firmUser.firmId),
  ]);

  if (!adjuster) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={adjuster.displayName}
        subtitle="Identity, capacity, capabilities, and home base setup."
      />
      <AdjusterProfile
        adjuster={adjuster}
        carrierOptions={carrierOptions}
        canEdit={firmUser.role === 'firm_admin' || firmUser.role === 'super_admin'}
      />
    </div>
  );
}
