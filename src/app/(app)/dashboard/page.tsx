import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';
import { DashboardExaminer } from '@/components/dashboard/DashboardExaminer';
import { DashboardDispatcher } from '@/components/dashboard/DashboardDispatcher';
import { DashboardAdjuster } from '@/components/dashboard/DashboardAdjuster';
import { DashboardCarrier } from '@/components/dashboard/DashboardCarrier';
import { DashboardCarrierAdmin } from '@/components/dashboard/DashboardCarrierAdmin';
import { DashboardCarrierDeskAdjuster } from '@/components/dashboard/DashboardCarrierDeskAdjuster';
import { getCarrierForFirmUser } from '@/lib/supabase/carriers';
import { getClaims } from '@/lib/supabase/claims';
import {
  getDashboardStats,
  getAdjusterDashboardData,
  getDispatcherDashboardData,
  getExaminerDashboardData,
} from '@/lib/supabase/dashboard';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { createAdminClient } from '@/lib/supabase/admin';
import { mergeLayout, defaultLayout } from '@/lib/dashboard-cards';
import type { CardLayoutItem } from '@/lib/dashboard-cards';
import type { Role } from '@/lib/types';

async function getSavedLayout(firmUserId: string, role: Role): Promise<CardLayoutItem[] | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('user_preferences')
      .select('dashboard_cards')
      .eq('user_id', firmUserId)
      .maybeSingle<{ dashboard_cards: Record<string, unknown> | null }>();

    const raw = data?.dashboard_cards;
    if (!raw || !Array.isArray(raw.layout)) return null;
    return mergeLayout(raw.layout as CardLayoutItem[], role);
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const { id, firmUserId, role, firmId, name, firmName, firmPhone } = await requireAuthenticatedFirmUser();

  if (role === 'examiner') {
    const [data, savedLayout] = await Promise.all([
      getExaminerDashboardData(firmId),
      getSavedLayout(firmUserId, role),
    ]);
    return <DashboardExaminer data={data} savedLayout={savedLayout} />;
  }

  if (role === 'dispatcher') {
    const [data, savedLayout] = await Promise.all([
      getDispatcherDashboardData(firmId),
      getSavedLayout(firmUserId, role),
    ]);
    return <DashboardDispatcher data={data} savedLayout={savedLayout} />;
  }

  if (role === 'adjuster') {
    const [data, savedLayout] = await Promise.all([
      getAdjusterDashboardData(firmId, id),
      getSavedLayout(firmUserId, role),
    ]);
    return <DashboardAdjuster name={name} data={data} savedLayout={savedLayout} />;
  }

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

  // firm_admin / super_admin
  const [stats, claims, savedLayout] = await Promise.all([
    getDashboardStats(firmId),
    getClaims(firmId, role, id),
    getSavedLayout(firmUserId, role),
  ]);

  return (
    <DashboardAdmin
      name={name}
      firmName={firmName}
      stats={stats}
      claims={claims}
      savedLayout={savedLayout}
    />
  );
}
