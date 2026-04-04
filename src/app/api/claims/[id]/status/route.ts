import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { ClaimStatus } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

const allowedStatuses: ClaimStatus[] = [
  'received',
  'assigned',
  'accepted',
  'contacted',
  'scheduled',
  'inspected',
  'in_review',
  'approved',
  'submitted',
  'closed',
  'on_hold',
  'pending_te',
  'pending_carrier_direction',
  'pending_engineer',
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (firmUser.role === 'carrier') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: ClaimStatus };

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const nextTimestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from('claims')
    .update({
      status: body.status,
      submitted_at: body.status === 'submitted' ? nextTimestamp : null,
      updated_at: nextTimestamp,
    })
    .eq('id', id)
    .eq('firm_id', firmUser.firmId)
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/claims');
  revalidatePath(`/claims/${id}`);

  return NextResponse.json({ success: true, claim: data });
}
