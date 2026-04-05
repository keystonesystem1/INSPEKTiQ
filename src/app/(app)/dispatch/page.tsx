import { DispatchPage } from '@/components/dispatch/DispatchPage';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function DispatchRoute() {
  const { firmId } = await requireAuthenticatedFirmUser();

  return <DispatchPage firmId={firmId} />;
}
