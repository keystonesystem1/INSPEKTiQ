import { redirect } from 'next/navigation';
import { DispatchPage } from '@/components/dispatch/DispatchPage';
import { getAdjustersForDispatchAdmin } from '@/lib/supabase/adjusters';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function DispatchRoute() {
  const { firmId, role } = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin', 'dispatcher'].includes(role)) {
    redirect('/dashboard');
  }

  const initialAdjusters = await getAdjustersForDispatchAdmin(firmId);

  return <DispatchPage firmId={firmId} initialAdjusters={initialAdjusters} />;
}
