import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface AssignClaimsBody {
  claimIds?: string[];
  adjusterId?: string;
  overrideReason?: string;
}

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'dispatcher', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as AssignClaimsBody;
  const claimIds = Array.from(new Set((body.claimIds ?? []).filter(Boolean)));

  if (!claimIds.length || !body.adjusterId) {
    return NextResponse.json({ error: 'Missing claim ids or adjuster id' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: adjusterRecord, error: adjusterError } = await supabase
    .from('firm_users')
    .select('user_id')
    .eq('firm_id', firmUser.firmId)
    .eq('user_id', body.adjusterId)
    .eq('role', 'adjuster')
    .eq('is_active', true)
    .maybeSingle();

  if (adjusterError) {
    return NextResponse.json({ error: adjusterError.message }, { status: 500 });
  }

  if (!adjusterRecord) {
    return NextResponse.json({ error: 'Adjuster not found' }, { status: 400 });
  }

  if (body.overrideReason?.trim()) {
    console.log('Claim assignment override reason:', {
      adjusterId: body.adjusterId,
      claimIds,
      overrideReason: body.overrideReason.trim(),
    });
  }

  const nextTimestamp = new Date().toISOString();
  const { error } = await supabase
    .from('claims')
    .update({
      assigned_user_id: body.adjusterId,
      status: 'assigned',
      updated_at: nextTimestamp,
    })
    .in('id', claimIds)
    .eq('firm_id', firmUser.firmId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/claims');
  revalidatePath('/dispatch');
  claimIds.forEach((claimId) => {
    revalidatePath(`/claims/${claimId}`);
  });

  return NextResponse.json({ success: true, assigned: claimIds });
}
