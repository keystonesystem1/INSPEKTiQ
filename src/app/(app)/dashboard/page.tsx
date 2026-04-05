import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';
import { DashboardExaminer } from '@/components/dashboard/DashboardExaminer';
import { DashboardDispatcher } from '@/components/dashboard/DashboardDispatcher';
import { DashboardAdjuster } from '@/components/dashboard/DashboardAdjuster';
import { DashboardCarrier } from '@/components/dashboard/DashboardCarrier';
import { getClaims } from '@/lib/supabase/claims';
import { getDashboardStats } from '@/lib/supabase/dashboard';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function DashboardPage() {
  const { id, role, firmId, name, firmName } = await requireAuthenticatedFirmUser();

  if (role === 'examiner') return <DashboardExaminer />;
  if (role === 'dispatcher') return <DashboardDispatcher />;
  if (role === 'adjuster') return <DashboardAdjuster />;
  if (role === 'carrier') return <DashboardCarrier />;

  const stats = await getDashboardStats(firmId);
  const claims = await getClaims(firmId, role, id);

  return <DashboardAdmin name={name} firmName={firmName} stats={stats} claims={claims} />;
}
