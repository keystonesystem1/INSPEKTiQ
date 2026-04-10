import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';
import { DashboardExaminer } from '@/components/dashboard/DashboardExaminer';
import { DashboardDispatcher } from '@/components/dashboard/DashboardDispatcher';
import { DashboardAdjuster } from '@/components/dashboard/DashboardAdjuster';
import { DashboardCarrier } from '@/components/dashboard/DashboardCarrier';
import { DashboardCarrierAdmin } from '@/components/dashboard/DashboardCarrierAdmin';
import { DashboardCarrierDeskAdjuster } from '@/components/dashboard/DashboardCarrierDeskAdjuster';
import { getCarrierForFirmUser } from '@/lib/supabase/carriers';
import { getClaims } from '@/lib/supabase/claims';
import { getDashboardStats } from '@/lib/supabase/dashboard';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function DashboardPage() {
  const { id, role, firmId, name, firmName, firmPhone } = await requireAuthenticatedFirmUser();

  if (role === 'examiner') return <DashboardExaminer />;
  if (role === 'dispatcher') return <DashboardDispatcher />;
  if (role === 'adjuster') return <DashboardAdjuster />;
  if (role === 'carrier') return <DashboardCarrier />;

  if (role === 'carrier_admin') {
    const [claims, carrier] = await Promise.all([
      getClaims(firmId, role, id),
      getCarrierForFirmUser(id),
    ]);
    const carrierName = carrier?.name ?? claims[0]?.carrier ?? firmName;
    return (
      <DashboardCarrierAdmin
        claims={claims}
        carrierName={carrierName}
        intakeEmail={carrier?.intakeEmail ?? null}
        firmPhone={firmPhone}
      />
    );
  }

  if (role === 'carrier_desk_adjuster') {
    const claims = await getClaims(firmId, role, id);
    return <DashboardCarrierDeskAdjuster claims={claims} />;
  }

  const stats = await getDashboardStats(firmId);
  const claims = await getClaims(firmId, role, id);

  return <DashboardAdmin name={name} firmName={firmName} stats={stats} claims={claims} />;
}
