import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkflowList } from '@/components/workflow-studio/WorkflowList';

export default async function WorkflowStudioPage() {
  const user = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      <PageHeader
        title="Workflow Studio"
        subtitle="Configure report templates, matching rules, and inspection workflows for your firm."
      />
      <WorkflowList />
    </div>
  );
}
