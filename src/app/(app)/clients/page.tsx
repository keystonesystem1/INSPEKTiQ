import { redirect } from 'next/navigation';
import { ClientRoster } from '@/components/clients/ClientRoster';
import { PageHeader } from '@/components/layout/PageHeader';
import { getCarriers } from '@/lib/supabase/carriers';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function ClientsPage() {
  const firmUser = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    redirect('/dashboard');
  }

  const carriers = await getCarriers(firmUser.firmId);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Carrier relationships, portal access, and billing preferences."
      />
      <ClientRoster carriers={carriers} />
    </div>
  );
}
