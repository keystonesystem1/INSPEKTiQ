import { notFound, redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { getWorkflowById } from '@/lib/supabase/workflows';
import { WorkflowEditor } from '@/components/workflow-studio/WorkflowEditor';

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const draft = await getWorkflowById(id, user.firmId);

  if (!draft) {
    notFound();
  }

  return <WorkflowEditor initialDraft={draft} />;
}
