import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCarrier, getCarriers, updateCarrier } from '@/lib/supabase/carriers';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import type { CarrierCreate } from '@/lib/types';

interface CreateCarrierBody extends CarrierCreate {
  portalEnabled?: boolean;
}

export async function GET() {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const carriers = await getCarriers(firmUser.firmId);
    return NextResponse.json({ carriers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load carriers.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as CreateCarrierBody;
  if (!body.name?.trim() || !body.contactName?.trim() || !body.contactEmail?.trim()) {
    return NextResponse.json({ error: 'Company name, contact name, and contact email are required.' }, { status: 400 });
  }

  try {
    const carrier = await createCarrier(firmUser.firmId, {
      name: body.name,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      billingPreference: body.billingPreference ?? 'desk_adjuster',
      billingContactName: body.billingContactName,
      billingContactEmail: body.billingContactEmail,
      billingAddress: body.billingAddress,
      billingCity: body.billingCity,
      billingState: body.billingState,
      billingZip: body.billingZip,
      notes: body.notes,
      guidelinesUrl: body.guidelinesUrl,
      guidelinesNotes: body.guidelinesNotes,
    });

    if (body.portalEnabled) {
      const supabase = createAdminClient();
      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        body.contactEmail.trim(),
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
          data: { role: 'carrier_admin', firm_id: firmUser.firmId, carrier_id: carrier.id },
        },
      );
      if (inviteError) {
        return NextResponse.json(
          { error: `Carrier created, but invite failed: ${inviteError.message}`, carrier },
          { status: 500 },
        );
      }

      const invitedUserId = invited?.user?.id;
      if (invitedUserId) {
        const { error: firmUserError } = await supabase.from('firm_users').insert({
          firm_id: firmUser.firmId,
          user_id: invitedUserId,
          role: 'carrier_admin',
          carrier_id: carrier.id,
          is_active: true,
          invited_at: new Date().toISOString(),
        });
        if (firmUserError) {
          return NextResponse.json(
            { error: `Invite sent, but firm_users insert failed: ${firmUserError.message}`, carrier },
            { status: 500 },
          );
        }
      }

      await updateCarrier(firmUser.firmId, carrier.id, {
        portalEnabled: true,
        inviteStatus: 'pending',
      });
    }

    revalidatePath('/clients');
    return NextResponse.json({ carrier });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create carrier.' },
      { status: 500 },
    );
  }
}
