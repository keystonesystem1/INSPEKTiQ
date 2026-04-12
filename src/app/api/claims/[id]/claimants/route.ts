import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface ClaimantRow {
  id: string;
  claim_id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string | null;
}

async function validateClaimAccess(claimId: string, firmId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('claims')
    .select('id')
    .eq('id', claimId)
    .eq('firm_id', firmId)
    .maybeSingle<{ id: string }>();
  return Boolean(data);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: claimId } = await params;
  const hasAccess = await validateClaimAccess(claimId, firmUser.firmId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claimants')
    .select('id, claim_id, name, role, phone, email, address, created_at')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ claimants: (data ?? []) as ClaimantRow[] });
}

interface CreateClaimantBody {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const VALID_ROLES = new Set(['primary', 'secondary', 'other']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: claimId } = await params;
  const hasAccess = await validateClaimAccess(claimId, firmUser.firmId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json()) as CreateClaimantBody;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const claimantRole = VALID_ROLES.has(body.role ?? '') ? body.role : 'primary';

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claimants')
    .insert({
      claim_id: claimId,
      name: body.name.trim(),
      role: claimantRole,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      created_at: new Date().toISOString(),
    })
    .select('id, claim_id, name, role, phone, email, address, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ claimant: data }, { status: 201 });
}
