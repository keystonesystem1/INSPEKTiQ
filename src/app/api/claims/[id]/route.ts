import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/mapbox/geocoding';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import type { ClaimContactEntry } from '@/lib/types';

interface UpdateClaimBody {
  claimNumber?: string;
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
  claimContacts?: ClaimContactEntry[];
}

const VALID_CONTACT_KINDS = new Set(['contractor', 'public_adjuster', 'other']);

function sanitizeContacts(input: unknown): ClaimContactEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => {
      const kind =
        typeof entry.kind === 'string' && VALID_CONTACT_KINDS.has(entry.kind)
          ? (entry.kind as ClaimContactEntry['kind'])
          : 'other';
      return {
        id: typeof entry.id === 'string' && entry.id ? entry.id : crypto.randomUUID(),
        kind,
        label: typeof entry.label === 'string' ? entry.label : undefined,
        name: typeof entry.name === 'string' ? entry.name : '',
        company: typeof entry.company === 'string' ? entry.company : undefined,
        phone: typeof entry.phone === 'string' ? entry.phone : undefined,
        email: typeof entry.email === 'string' ? entry.email : undefined,
      } satisfies ClaimContactEntry;
    });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as UpdateClaimBody;
  const { id } = await params;

  // claim_contacts updates are allowed for any authenticated firm user with
  // access to the claim (auto-populated contacts are read-only; only the
  // editable external contacts jsonb is touched here).
  const isContactsOnlyUpdate =
    body.claimContacts !== undefined &&
    Object.keys(body).every((key) => key === 'claimContacts');

  if (!isContactsOnlyUpdate && !['firm_admin', 'dispatcher', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  const update: Record<string, unknown> = {
    ...(body.claimNumber !== undefined && { claim_number: body.claimNumber.trim() || undefined }),
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

  if (body.claimContacts !== undefined) {
    update.claim_contacts = sanitizeContacts(body.claimContacts);
  }

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
