import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import { createAppointment } from '@/lib/supabase/appointments';

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'dispatcher', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    claimId?: string;
    date?: string;
    arrivalTime?: string;
    endTime?: string;
    notes?: string;
  };

  if (!body.claimId || !body.date || !body.arrivalTime || !body.endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await createAppointment({
    claimId: body.claimId,
    firmId: firmUser.firmId,
    date: body.date,
    arrivalTime: body.arrivalTime,
    endTime: body.endTime,
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  revalidatePath('/calendar');
  revalidatePath('/claims');

  return NextResponse.json({ success: true });
}
