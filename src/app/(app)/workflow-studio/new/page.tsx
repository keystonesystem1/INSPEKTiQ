import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { createWorkflow } from '@/lib/supabase/workflows';

export default async function NewWorkflowPage() {
  const user = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  const id = await createWorkflow(user.firmId);
  redirect(`/workflow-studio/${id}`);
}
