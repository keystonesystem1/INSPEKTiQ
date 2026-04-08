import { notFound, redirect } from 'next/navigation';
import { ClientProfile } from '@/components/clients/ClientProfile';
import { PageHeader } from '@/components/layout/PageHeader';
import { getCarrierById } from '@/lib/supabase/carriers';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ carrierId: string }>;
}) {
  const { carrierId } = await params;
  const firmUser = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    redirect('/dashboard');
  }

  const carrier = await getCarrierById(firmUser.firmId, carrierId);
  if (!carrier) notFound();

  return (
    <div>
      <PageHeader
        title={carrier.name}
        subtitle="Identity, portal access, billing preferences, and guidelines."
      />
      <ClientProfile carrier={carrier} />
    </div>
  );
}
