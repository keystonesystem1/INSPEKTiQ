import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import { mergeLayout, getCardDefs, defaultLayout } from '@/lib/dashboard-cards';
import type { CardLayoutItem } from '@/lib/dashboard-cards';

interface PreferencesRow {
  user_id: string;
  dashboard_cards: Record<string, unknown> | null;
  updated_at: string | null;
}

export async function GET() {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('user_preferences')
    .select('user_id, dashboard_cards, updated_at')
    .eq('user_id', firmUser.firmUserId)
    .maybeSingle<PreferencesRow>();

  const raw = data?.dashboard_cards;
  const saved = Array.isArray(raw?.layout) ? (raw.layout as CardLayoutItem[]) : null;
  const layout = saved
    ? mergeLayout(saved, firmUser.role)
    : defaultLayout(firmUser.role);

  return NextResponse.json({ layout });
}

interface PatchBody {
  layout?: unknown;
}

export async function PATCH(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as PatchBody;

  if (!Array.isArray(body.layout)) {
    return NextResponse.json({ error: 'layout must be an array' }, { status: 400 });
  }

  const defs = getCardDefs(firmUser.role);
  const validIds = new Set(defs.map((d) => d.id));

  // Sanitise each item — reject unknown card IDs, coerce size
  const layout: CardLayoutItem[] = (body.layout as unknown[])
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .filter((item) => typeof item.id === 'string' && validIds.has(item.id))
    .map((item) => {
      const def = defs.find((d) => d.id === item.id)!;
      const size = def.allowedSizes.includes(item.size as 'half' | 'full')
        ? (item.size as 'half' | 'full')
        : def.defaultSize;
      return {
        id: item.id as string,
        size,
        visible: typeof item.visible === 'boolean' ? item.visible : true,
      };
    });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: firmUser.firmUserId,
        dashboard_cards: { layout },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, layout });
}
