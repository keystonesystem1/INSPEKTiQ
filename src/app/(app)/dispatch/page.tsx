import { DispatchPage } from '@/components/dispatch/DispatchPage';
import { getAdjustersForDispatchAdmin } from '@/lib/supabase/adjusters';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function DispatchRoute() {
  const { firmId } = await requireAuthenticatedFirmUser();
  const initialAdjusters = await getAdjustersForDispatchAdmin(firmId);

  return <DispatchPage firmId={firmId} initialAdjusters={initialAdjusters} />;
}
