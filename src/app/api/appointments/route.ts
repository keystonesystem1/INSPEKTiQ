import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'needs_attention' | 'cancelled';

interface CreateAppointmentBody {
  claimId?: string;
  firmId?: string;
  adjusterUserId?: string | null;
  arrivalTime?: string;
  endTime?: string;
  claim_id?: string;
  firm_id?: string;
  adjuster_user_id?: string | null;
  date?: string;
  arrival_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

const ALLOWED_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'needs_attention',
  'cancelled',
];

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (firmUser.role === 'carrier') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as CreateAppointmentBody;
  const claimId = body.claimId ?? body.claim_id;
  const firmId = body.firmId ?? body.firm_id;
  const adjusterUserId = body.adjusterUserId ?? body.adjuster_user_id ?? null;
  const arrivalTime = body.arrivalTime ?? body.arrival_time;
  const endTime = body.endTime ?? body.end_time;
  const status = body.status ?? 'pending';

  if (
    !claimId ||
    !firmId ||
    !body.date ||
    !arrivalTime ||
    !endTime
  ) {
    return NextResponse.json({ error: 'Missing required appointment fields.' }, { status: 400 });
  }

  if (firmId !== firmUser.firmId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid appointment status.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      claim_id: claimId,
      firm_id: firmId,
      adjuster_user_id: adjusterUserId,
      date: body.date,
      arrival_time: arrivalTime,
      end_time: endTime,
      status,
      notes: body.notes ?? null,
      created_at: now,
      updated_at: now,
    })
    .select('id, claim_id, firm_id, adjuster_user_id, date, arrival_time, end_time, status, notes, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: claimError } = await supabase
    .from('claims')
    .update({
      status: 'scheduled',
      updated_at: now,
    })
    .eq('id', claimId)
    .eq('firm_id', firmId);

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  revalidatePath('/calendar');
  revalidatePath('/claims');
  revalidatePath(`/claims/${claimId}`);

  return NextResponse.json({ success: true, appointment: data }, { status: 201 });
}
