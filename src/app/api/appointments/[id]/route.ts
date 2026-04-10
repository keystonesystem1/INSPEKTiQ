import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'needs_attention', 'cancelled'] as const;
type AppointmentStatus = (typeof ALLOWED_STATUSES)[number];

interface PatchBody {
  status?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'super_admin', 'dispatcher', 'adjuster'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as PatchBody;
  const status = body.status as AppointmentStatus | undefined;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('appointments')
    .select('firm_id')
    .eq('id', id)
    .maybeSingle<{ firm_id: string }>();

  if (!existing) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  if (existing.firm_id !== firmUser.firmId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/calendar');

  return NextResponse.json({ success: true });
}
