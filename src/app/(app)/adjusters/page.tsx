import { redirect } from 'next/navigation';
import { AdjusterRoster } from '@/components/adjusters/AdjusterRoster';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAdjusters } from '@/lib/supabase/adjusters';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function AdjustersPage() {
  const firmUser = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    redirect('/dashboard');
  }

  const adjusters = await getAdjusters(firmUser.firmId);

  return (
    <div>
      <PageHeader
        title="Adjusters"
        subtitle="Roster, capacity, and setup readiness for your firm."
      />
      <AdjusterRoster adjusters={adjusters} />
    </div>
  );
}
