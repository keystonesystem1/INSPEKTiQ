import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import type { DEFAULT_SLA } from '@/lib/utils/sla';

type SlaSettings = typeof DEFAULT_SLA;

export default async function SettingsPage() {
  const user = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  const supabase = createAdminClient();
  const { data: firmData } = await supabase
    .from('firms')
    .select('primary_color, settings, intake_token')
    .eq('id', user.firmId)
    .maybeSingle<{ primary_color: string | null; settings: Record<string, unknown> | null; intake_token: string | null }>();

  const primaryColor = firmData?.primary_color ?? '#4298CC';
  const slaSettings = (firmData?.settings?.sla ?? null) as SlaSettings | null;
  const intakeToken = firmData?.intake_token ?? undefined;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Firm profile, SLAs, notifications, integrations, and routing preferences." />
      <SettingsLayout
        firmName={user.firmName}
        firmSettings={user.firmSettings}
        primaryColor={primaryColor}
        slaSettings={slaSettings}
        userFullName={user.name}
        userEmail={user.email}
        firmUserId={user.firmUserId}
        intakeToken={intakeToken}
      />
    </div>
  );
}
