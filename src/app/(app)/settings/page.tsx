import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

export default async function SettingsPage() {
  const { firmName, role } = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Firm profile, SLAs, notifications, integrations, and routing preferences." />
      <SettingsLayout firmName={firmName} />
    </div>
  );
}
