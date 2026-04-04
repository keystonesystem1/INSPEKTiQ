import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';
import { DashboardExaminer } from '@/components/dashboard/DashboardExaminer';
import { DashboardDispatcher } from '@/components/dashboard/DashboardDispatcher';
import { DashboardAdjuster } from '@/components/dashboard/DashboardAdjuster';
import { DashboardCarrier } from '@/components/dashboard/DashboardCarrier';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function DashboardPage() {
  const { role } = await requireAuthenticatedFirmUser();

  if (role === 'examiner') return <DashboardExaminer />;
  if (role === 'dispatcher') return <DashboardDispatcher />;
  if (role === 'adjuster') return <DashboardAdjuster />;
  if (role === 'carrier') return <DashboardCarrier />;

  return <DashboardAdmin />;
}
