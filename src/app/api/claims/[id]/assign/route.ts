import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'dispatcher', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { assignedUserId } = (await request.json()) as { assignedUserId?: string };
  const { id } = await params;

  if (!assignedUserId) {
    return NextResponse.json({ error: 'Missing assigned user id' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: adjusterRecord, error: adjusterError } = await supabase
    .from('firm_users')
    .select('user_id')
    .eq('firm_id', firmUser.firmId)
    .eq('user_id', assignedUserId)
    .eq('role', 'adjuster')
    .eq('is_active', true)
    .maybeSingle();

  if (adjusterError) {
    return NextResponse.json({ error: adjusterError.message }, { status: 500 });
  }

  if (!adjusterRecord) {
    return NextResponse.json({ error: 'Adjuster not found' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('claims')
    .update({
      assigned_user_id: assignedUserId,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('firm_id', firmUser.firmId)
    .select('id, assigned_user_id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/claims');
  revalidatePath(`/claims/${id}`);

  return NextResponse.json({ success: true, claim: data });
}
