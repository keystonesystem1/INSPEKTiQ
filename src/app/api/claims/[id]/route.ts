import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/mapbox/geocoding';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface UpdateClaimBody {
  insuredName?: string;
  phone?: string;
  email?: string;
  lossAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  carrier?: string;
  lossType?: string;
  claimCategory?: string;
  dateOfLoss?: string;
  policyNumber?: string;
  lossDescription?: string;
}

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

  const body = (await request.json()) as UpdateClaimBody;
  const { id } = await params;
  const supabase = createAdminClient();
  const shouldRefreshCoordinates = ['lossAddress', 'city', 'state', 'zip'].some((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );

  let coordinateUpdate: { loss_lat?: number | null; loss_lng?: number | null } = {};

  if (shouldRefreshCoordinates) {
    const { data: existingClaim, error: existingClaimError } = await supabase
      .from('claims')
      .select('loss_address, city, state, zip')
      .eq('id', id)
      .eq('firm_id', firmUser.firmId)
      .single();

    if (existingClaimError) {
      return NextResponse.json({ error: existingClaimError.message }, { status: 500 });
    }

    const geocodedPoint = await geocodeAddress({
      lossAddress: body.lossAddress ?? existingClaim.loss_address,
      city: body.city ?? existingClaim.city,
      state: body.state ?? existingClaim.state,
      zip: body.zip ?? existingClaim.zip,
    });

    coordinateUpdate = {
      loss_lat: geocodedPoint?.lat ?? null,
      loss_lng: geocodedPoint?.lng ?? null,
    };
  }

  const update = {
    insured_name: body.insuredName,
    insured_phone: body.phone,
    insured_email: body.email,
    loss_address: body.lossAddress,
    city: body.city,
    state: body.state,
    zip: body.zip,
    carrier: body.carrier,
    loss_type: body.lossType,
    // TODO: claim_category not in schema — storing in policy_type temporarily, see TECH_DEBT.md
    policy_type: body.claimCategory,
    date_of_loss: body.dateOfLoss,
    policy_number: body.policyNumber,
    loss_description: body.lossDescription,
    ...coordinateUpdate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('claims')
    .update(update)
    .eq('id', id)
    .eq('firm_id', firmUser.firmId)
    .select('id, insured_name, carrier, loss_address')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/claims');
  revalidatePath(`/claims/${id}`);
  revalidatePath('/dispatch');
  revalidatePath('/calendar');

  return NextResponse.json({ success: true, claim: data });
}
