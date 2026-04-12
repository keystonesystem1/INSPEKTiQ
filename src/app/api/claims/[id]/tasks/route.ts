import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface TaskRow {
  id: string;
  claim_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string | null;
  assigned_to: string | null;
}

async function validateClaimAccess(claimId: string, firmId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('claims')
    .select('id')
    .eq('id', claimId)
    .eq('firm_id', firmId)
    .maybeSingle<{ id: string }>();
  return Boolean(data);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: claimId } = await params;
  const hasAccess = await validateClaimAccess(claimId, firmUser.firmId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claim_tasks')
    .select('id, claim_id, title, due_date, completed, completed_at, created_at, assigned_to')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: (data ?? []) as TaskRow[] });
}

interface CreateTaskBody {
  title?: string;
  dueDate?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: claimId } = await params;
  const hasAccess = await validateClaimAccess(claimId, firmUser.firmId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json()) as CreateTaskBody;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claim_tasks')
    .insert({
      claim_id: claimId,
      title: body.title.trim(),
      due_date: body.dueDate ?? null,
      completed: false,
      created_at: new Date().toISOString(),
    })
    .select('id, claim_id, title, due_date, completed, completed_at, created_at, assigned_to')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ task: data }, { status: 201 });
}
