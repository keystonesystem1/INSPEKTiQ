import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface InviteBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  maxActiveClaims?: number;
}

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as InviteBody;
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim();
  // Note: body.maxActiveClaims is intentionally ignored. We cannot create
  // an adjuster_profiles row at invite time because the invited user does
  // not yet exist in auth.users (Supabase only creates the auth user on
  // signup completion), and adjuster_profiles.user_id has an FK to auth.users.
  // The adjuster_profiles row is created lazily on first login in
  // requireAuthenticatedFirmUser() with default max_active_claims = 10.

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'First name, last name, and email are required.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    data: { role: 'adjuster', firm_id: firmUser.firmId },
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const invitedUserId = invited?.user?.id;
  if (!invitedUserId) {
    return NextResponse.json({ error: 'Invite sent but no user id returned.' }, { status: 500 });
  }

  const fullName = `${firstName} ${lastName}`;
  const nowIso = new Date().toISOString();

  const { error: firmUserError } = await supabase.from('firm_users').insert({
    firm_id: firmUser.firmId,
    user_id: invitedUserId,
    role: 'adjuster',
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    is_active: true,
    invited_at: nowIso,
  });

  if (firmUserError) {
    return NextResponse.json({ error: `Invite sent, but firm_users insert failed: ${firmUserError.message}` }, { status: 500 });
  }

  revalidatePath('/adjusters');
  return NextResponse.json({ success: true });
}
