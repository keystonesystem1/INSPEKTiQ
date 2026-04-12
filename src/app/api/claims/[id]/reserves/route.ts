import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface ReserveRow {
  id: string;
  claim_id: string;
  location: string | null;
  description: string | null;
  coverage_type: string | null;
  amount: number | null;
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
    .from('reserves')
    .select('id, claim_id, location, description, coverage_type, amount, created_at')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reserves: (data ?? []) as ReserveRow[] });
}

interface CreateReserveBody {
  location?: string;
  description?: string;
  coverageType?: string;
  amount?: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (['carrier', 'carrier_admin', 'carrier_desk_adjuster'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: claimId } = await params;
  const hasAccess = await validateClaimAccess(claimId, firmUser.firmId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json()) as CreateReserveBody;
  if (!body.description && !body.coverageType) {
    return NextResponse.json({ error: 'description or coverageType required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reserves')
    .insert({
      claim_id: claimId,
      location: body.location ?? null,
      description: body.description ?? null,
      coverage_type: body.coverageType ?? null,
      amount: body.amount ?? null,
      created_at: new Date().toISOString(),
    })
    .select('id, claim_id, location, description, coverage_type, amount, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reserve: data }, { status: 201 });
}
