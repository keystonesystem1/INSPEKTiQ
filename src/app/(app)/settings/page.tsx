import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Firm profile, SLAs, notifications, integrations, and routing preferences." />
      <SettingsLayout />
    </div>
  );
}
