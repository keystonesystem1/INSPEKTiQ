import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface PatchBody {
  completed?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: claimId, taskId } = await params;
  const supabase = createAdminClient();

  // Verify the task belongs to a claim in this firm
  const { data: taskRow } = await supabase
    .from('claim_tasks')
    .select('id, claim_id')
    .eq('id', taskId)
    .maybeSingle<{ id: string; claim_id: string }>();

  if (!taskRow || taskRow.claim_id !== claimId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: claimRow } = await supabase
    .from('claims')
    .select('firm_id')
    .eq('id', claimId)
    .maybeSingle<{ firm_id: string }>();

  if (!claimRow || claimRow.firm_id !== firmUser.firmId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as PatchBody;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('claim_tasks')
    .update({
      completed: body.completed ?? false,
      completed_at: body.completed ? now : null,
    })
    .eq('id', taskId)
    .select('id, claim_id, title, due_date, completed, completed_at, created_at, assigned_to')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ task: data });
}
