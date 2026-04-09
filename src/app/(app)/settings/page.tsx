import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

export default async function SettingsPage() {
  const { firmName } = await requireAuthenticatedFirmUser();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Firm profile, SLAs, notifications, integrations, and routing preferences." />
      <SettingsLayout firmName={firmName} />
    </div>
  );
}
