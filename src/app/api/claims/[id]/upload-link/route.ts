import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

const ALLOWED_ROLES = new Set([
  'firm_admin',
  'super_admin',
  'dispatcher',
  'adjuster',
  'carrier_admin',
  'carrier_desk_adjuster',
]);

const VALID_RECIPIENT_TYPES = new Set(['insured', 'contractor', 'carrier', 'public_adjuster', 'other']);

interface CreateTokenBody {
  recipientType?: string;
  recipientName?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ALLOWED_ROLES.has(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: claimId } = await params;
  const body = (await request.json().catch(() => ({}))) as CreateTokenBody;

  const recipientType = body.recipientType?.trim().toLowerCase() ?? '';
  if (!VALID_RECIPIENT_TYPES.has(recipientType)) {
    return NextResponse.json({ error: 'Invalid recipient type' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Confirm the claim exists and belongs to the user's firm (or, for carrier
  // roles, their carrier) before minting a token.
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('id, firm_id, carrier_id')
    .eq('id', claimId)
    .maybeSingle<{ id: string; firm_id: string; carrier_id: string | null }>();
  if (claimError || !claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }
  if (claim.firm_id !== firmUser.firmId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from('upload_tokens')
    .insert({
      token: crypto.randomUUID(),
      claim_id: claimId,
      created_by: firmUser.id,
      recipient_type: recipientType,
      recipient_name: body.recipientName?.trim() || null,
      expires_at: expiresAt,
    })
    .select('token')
    .single<{ token: string }>();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? 'Unable to create upload link.' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ?? '';
  const url = baseUrl ? `${baseUrl}/${inserted.token}` : `/upload/${inserted.token}`;

  return NextResponse.json({ success: true, token: inserted.token, url });
}
