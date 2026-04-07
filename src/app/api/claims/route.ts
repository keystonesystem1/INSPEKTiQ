import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/mapbox/geocoding';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface CreateClaimBody {
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

function buildClaimNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `MAN-${year}-${random}`;
}

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'dispatcher', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as CreateClaimBody;

  if (!body.insuredName || !body.lossAddress || !body.carrier || !body.lossType || !body.dateOfLoss) {
    return NextResponse.json({ error: 'Missing required claim fields.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const geocodedPoint = await geocodeAddress({
    lossAddress: body.lossAddress,
    city: body.city,
    state: body.state,
    zip: body.zip,
  });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claims')
    .insert({
      claim_number: buildClaimNumber(),
      insured_name: body.insuredName,
      insured_phone: body.phone ?? null,
      insured_email: body.email ?? null,
      loss_address: body.lossAddress,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      carrier: body.carrier,
      loss_type: body.lossType,
      // TODO: claim_category not in schema — storing in policy_type temporarily, see TECH_DEBT.md
      policy_type: body.claimCategory ?? 'Residential',
      date_of_loss: body.dateOfLoss,
      policy_number: body.policyNumber ?? null,
      loss_description: body.lossDescription ?? null,
      loss_lat: geocodedPoint?.lat ?? null,
      loss_lng: geocodedPoint?.lng ?? null,
      status: 'received',
      firm_id: firmUser.firmId,
      user_id: firmUser.id,
      firm_name: firmUser.firmName,
      received_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id, claim_number, insured_name, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/claims');
  revalidatePath('/dispatch');
  revalidatePath('/calendar');
  return NextResponse.json({ success: true, claim: data }, { status: 201 });
}
