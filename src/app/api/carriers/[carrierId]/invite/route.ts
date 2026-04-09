import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCarrierById, updateCarrier } from '@/lib/supabase/carriers';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface InviteBody {
  resendUserId?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ carrierId: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { carrierId } = await params;
  const body = (await request.json().catch(() => ({}))) as InviteBody;

  let carrier;
  try {
    carrier = await getCarrierById(firmUser.firmId, carrierId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load carrier.' },
      { status: 500 },
    );
  }
  if (!carrier) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });

  const supabase = createAdminClient();

  let targetEmail: string | null = null;
  let targetRole: 'carrier_admin' | 'carrier_desk_adjuster' = 'carrier_admin';

  if (body.resendUserId) {
    const existing = carrier.portalUsers.find((user) => user.userId === body.resendUserId);
    if (!existing) {
      return NextResponse.json({ error: 'Portal user not found for this carrier.' }, { status: 404 });
    }
    targetEmail = existing.email;
    targetRole = existing.role;
  } else {
    if (!carrier.contactEmail?.trim()) {
      return NextResponse.json({ error: 'Carrier has no contact email to invite.' }, { status: 400 });
    }
    targetEmail = carrier.contactEmail.trim();
  }

  if (!targetEmail) {
    return NextResponse.json({ error: 'No email to invite.' }, { status: 400 });
  }

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(targetEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    data: { role: targetRole, firm_id: firmUser.firmId, carrier_id: carrier.id },
  });

  // If the user already exists in auth.users, inviteUserByEmail returns an error.
  // Fall back to finding the existing auth user by email so we can still create/update
  // their firm_users row and give them the correct role.
  let resolvedUserId = invited?.user?.id ?? null;
  if (inviteError && !body.resendUserId) {
    const msg = inviteError.message.toLowerCase();
    const userAlreadyExists = msg.includes('already') || msg.includes('exists');

    if (!userAlreadyExists) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // User already registered — locate them via the admin listUsers API.
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 50000 });
    const existingAuthUser = listData?.users.find(
      (u) => u.email?.toLowerCase() === targetEmail.toLowerCase(),
    );

    if (!existingAuthUser?.id) {
      return NextResponse.json({ error: 'User already exists but could not be located. Please contact support.' }, { status: 500 });
    }

    resolvedUserId = existingAuthUser.id;
  } else if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  if (resolvedUserId && !body.resendUserId) {
    const { data: existingFirmUser } = await supabase
      .from('firm_users')
      .select('id')
      .eq('firm_id', firmUser.firmId)
      .eq('user_id', resolvedUserId)
      .maybeSingle<{ id: string }>();

    if (existingFirmUser?.id) {
      const { error: updateError } = await supabase
        .from('firm_users')
        .update({
          role: targetRole,
          carrier_id: carrier.id,
          is_active: true,
          invited_at: new Date().toISOString(),
        })
        .eq('id', existingFirmUser.id);
      if (updateError) {
        return NextResponse.json({ error: `Invite sent, firm_users update failed: ${updateError.message}` }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase.from('firm_users').insert({
        firm_id: firmUser.firmId,
        user_id: resolvedUserId,
        role: targetRole,
        carrier_id: carrier.id,
        is_active: true,
        invited_at: new Date().toISOString(),
      });
      if (insertError) {
        return NextResponse.json({ error: `Invite sent, firm_users insert failed: ${insertError.message}` }, { status: 500 });
      }
    }
  }

  try {
    await updateCarrier(firmUser.firmId, carrier.id, {
      portalEnabled: true,
      inviteStatus: 'pending',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invite sent, but carrier update failed.' },
      { status: 500 },
    );
  }

  revalidatePath('/clients');
  revalidatePath(`/clients/${carrier.id}`);
  return NextResponse.json({ success: true });
}
