import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface TERow {
  id: string;
  claim_id: string;
  entry_date: string;
  entry_type: string;
  description: string | null;
  amount: number | null;
  unit: string | null;
  invoiced: boolean;
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

  if (['carrier', 'carrier_admin', 'carrier_desk_adjuster'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: claimId } = await params;
  const hasAccess = await validateClaimAccess(claimId, firmUser.firmId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('time_expense')
    .select('id, claim_id, entry_date, entry_type, description, amount, unit, invoiced, created_at')
    .eq('claim_id', claimId)
    .order('entry_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: (data ?? []) as TERow[] });
}

const VALID_TYPES = new Set(['time', 'drive_time', 'mileage', 'expense']);

interface CreateTEBody {
  entryDate?: string;
  entryType?: string;
  description?: string;
  amount?: number;
  unit?: string;
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

  const body = (await request.json()) as CreateTEBody;
  if (!body.entryDate || !body.entryType) {
    return NextResponse.json({ error: 'entryDate and entryType are required' }, { status: 400 });
  }
  if (!VALID_TYPES.has(body.entryType)) {
    return NextResponse.json({ error: `entryType must be one of: ${[...VALID_TYPES].join(', ')}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('time_expense')
    .insert({
      claim_id: claimId,
      entry_date: body.entryDate,
      entry_type: body.entryType,
      description: body.description?.trim() || null,
      amount: body.amount ?? null,
      unit: body.unit?.trim() || null,
      invoiced: false,
      created_at: new Date().toISOString(),
    })
    .select('id, claim_id, entry_date, entry_type, description, amount, unit, invoiced, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entry: data }, { status: 201 });
}
