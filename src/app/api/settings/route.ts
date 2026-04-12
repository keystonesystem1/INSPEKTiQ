import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface SettingsPatchBody {
  firmName?: string;
  primaryColor?: string;
  settings?: Record<string, unknown>;
}

export async function GET() {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('firms')
    .select('name, primary_color, settings')
    .eq('id', firmUser.firmId)
    .single<{ name: string; primary_color: string | null; settings: Record<string, unknown> | null }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    firmName: data.name,
    primaryColor: data.primary_color ?? '#4298CC',
    settings: data.settings ?? {},
  });
}

export async function PATCH(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as SettingsPatchBody;
  const firmName = body.firmName?.trim();

  if (firmName !== undefined && !firmName) {
    return NextResponse.json({ error: 'Firm name is required' }, { status: 400 });
  }

  if (!firmName && !body.settings && !body.primaryColor) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};

  if (firmName) updates.name = firmName;
  if (body.primaryColor) updates.primary_color = body.primaryColor;

  if (body.settings) {
    const { data: existing } = await supabase
      .from('firms')
      .select('settings')
      .eq('id', firmUser.firmId)
      .maybeSingle<{ settings: Record<string, unknown> | null }>();
    updates.settings = { ...(existing?.settings ?? {}), ...body.settings };
  }

  const { error } = await supabase
    .from('firms')
    .update(updates)
    .eq('id', firmUser.firmId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
