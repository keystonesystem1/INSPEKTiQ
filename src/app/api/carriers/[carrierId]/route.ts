import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCarrierById, updateCarrier } from '@/lib/supabase/carriers';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import type { CarrierCreate } from '@/lib/types';

interface UpdateCarrierBody extends Partial<CarrierCreate> {
  isActive?: boolean;
  portalEnabled?: boolean;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ carrierId: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { carrierId } = await params;
  try {
    const carrier = await getCarrierById(firmUser.firmId, carrierId);
    if (!carrier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ carrier });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load carrier.' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ carrierId: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { carrierId } = await params;
  const body = (await request.json()) as UpdateCarrierBody;

  try {
    await updateCarrier(firmUser.firmId, carrierId, body);
    revalidatePath('/clients');
    revalidatePath(`/clients/${carrierId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update carrier.' },
      { status: 500 },
    );
  }
}
