import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { WorkflowEditor } from '@/components/workflow-studio/WorkflowEditor';

export default async function NewWorkflowPage() {
  const user = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  return <WorkflowEditor />;
}
