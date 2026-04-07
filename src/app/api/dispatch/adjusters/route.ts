import { NextResponse } from 'next/server';
import { getAdjustersForDispatchAdmin } from '@/lib/supabase/adjusters';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

export async function GET() {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'dispatcher', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const adjusters = await getAdjustersForDispatchAdmin(firmUser.firmId);
    return NextResponse.json({ adjusters });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load adjusters.' },
      { status: 500 },
    );
  }
}
