import { cookies } from 'next/headers';
import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';
import { DashboardExaminer } from '@/components/dashboard/DashboardExaminer';
import { DashboardDispatcher } from '@/components/dashboard/DashboardDispatcher';
import { DashboardAdjuster } from '@/components/dashboard/DashboardAdjuster';
import { DashboardCarrier } from '@/components/dashboard/DashboardCarrier';
import { getRoleFromCookie } from '@/lib/utils/roles';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = getRoleFromCookie(cookieStore.get('inspektiq-role')?.value) ?? 'firm_admin';

  if (role === 'examiner') return <DashboardExaminer />;
  if (role === 'dispatcher') return <DashboardDispatcher />;
  if (role === 'adjuster') return <DashboardAdjuster />;
  if (role === 'carrier') return <DashboardCarrier />;

  return <DashboardAdmin />;
}
