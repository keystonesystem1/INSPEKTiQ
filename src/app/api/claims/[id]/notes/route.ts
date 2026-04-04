import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface FirmUserIdRow {
  id: string;
}

export async function POST(
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

  const { id: claimId } = await params;
  const body = (await request.json()) as {
    noteType?: 'internal' | 'shared';
    content?: string;
  };

  const noteType = body.noteType;
  const content = body.content?.trim();

  if (!noteType || !['internal', 'shared'].includes(noteType) || !content) {
    return NextResponse.json({ error: 'Invalid note payload' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: authorRow, error: authorError } = await supabase
    .from('firm_users')
    .select('id')
    .eq('firm_id', firmUser.firmId)
    .eq('user_id', firmUser.id)
    .maybeSingle<FirmUserIdRow>();

  if (authorError) {
    return NextResponse.json({ error: authorError.message }, { status: 500 });
  }

  if (!authorRow) {
    return NextResponse.json({ error: 'Author not found' }, { status: 400 });
  }

  const { error } = await supabase
    .from('claim_notes')
    .insert({
      claim_id: claimId,
      author_id: authorRow.id,
      note_type: noteType,
      content,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/claims/${claimId}`);

  return NextResponse.json({ success: true });
}
