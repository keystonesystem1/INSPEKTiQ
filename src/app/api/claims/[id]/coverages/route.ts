import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface CoverageRow {
  id: string;
  claim_id: string;
  coverage_type: string;
  limit_amount: number | null;
  deductible: number | null;
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
    .from('coverages')
    .select('id, claim_id, coverage_type, limit_amount, deductible, created_at')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ coverages: (data ?? []) as CoverageRow[] });
}

interface CreateCoverageBody {
  coverageType?: string;
  limitAmount?: number;
  deductible?: number;
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

  const body = (await request.json()) as CreateCoverageBody;
  if (!body.coverageType?.trim()) {
    return NextResponse.json({ error: 'coverageType is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('coverages')
    .insert({
      claim_id: claimId,
      coverage_type: body.coverageType.trim(),
      limit_amount: body.limitAmount ?? null,
      deductible: body.deductible ?? null,
      created_at: new Date().toISOString(),
    })
    .select('id, claim_id, coverage_type, limit_amount, deductible, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ coverage: data }, { status: 201 });
}
