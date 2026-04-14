import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { ClaimStatus } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

const allowedStatuses: ClaimStatus[] = [
  'pending_acceptance',
  'received',
  'assigned',
  'accepted',
  'contact_attempted',
  'contacted',
  'scheduled',
  'inspection_started',
  'inspection_completed',
  'in_review',
  'approved',
  'submitted',
  'closed',
  'on_hold',
  'pending_te',
  'pending_carrier_direction',
  'pending_engineer',
  'needs_attention',
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (firmUser.role === 'carrier' || firmUser.role === 'carrier_admin' || firmUser.role === 'carrier_desk_adjuster') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: ClaimStatus; declineNote?: string };

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

  // Optional decline note: insert a shared note attributed to the firm user
  // performing the status change. Used by the dispatch decline flow.
  const declineNote = body.declineNote?.trim();
  if (declineNote) {
    const { data: authorRow } = await supabase
      .from('firm_users')
      .select('id')
      .eq('firm_id', firmUser.firmId)
      .eq('user_id', firmUser.id)
      .maybeSingle<{ id: string }>();
    if (authorRow?.id) {
      await supabase.from('claim_notes').insert({
        claim_id: id,
        author_id: authorRow.id,
        note_type: 'shared',
        content: declineNote,
      });
    }
  }

  revalidatePath('/claims');
  revalidatePath(`/claims/${id}`);
  revalidatePath('/dispatch');

  return NextResponse.json({ success: true, claim: data });
}
