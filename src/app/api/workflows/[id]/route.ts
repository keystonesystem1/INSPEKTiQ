import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id)
    .eq('firm_id', firmUser.firmId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
