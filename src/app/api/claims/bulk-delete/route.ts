import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  }

  // Fetch assignment IDs for these claims first — needed to delete invoices and claim_status_log
  const { data: assignments } = await supabase
    .from('claim_assignments')
    .select('id')
    .in('claim_id', ids);
  const assignmentIds = (assignments ?? []).map((a: { id: string }) => a.id);

  // Delete invoices and claim_status_log by assignment_id before claim_assignments
  if (assignmentIds.length > 0) {
    await supabase.from('invoices' as any).delete().in('assignment_id', assignmentIds);
    await supabase.from('claim_status_log' as any).delete().in('assignment_id', assignmentIds);
  }

  // Delete claim_shares if table exists
  await supabase.from('claim_shares' as any).delete().in('claim_id', ids);

  // Delete all direct claim_id children in dependency order
  const tables = [
    'claim_milestones',
    'claim_notes',
    'notes',
    'claim_tasks',
    'appointments',
    'time_expense',
    'reserves',
    'claimants',
    'loss_locations',
    'coverages',
    'claim_events',
    'claim_status_events',
    'upload_tokens',
    'claim_documents',
    'photos',
    'inspections',
    'claim_assignments',
  ];

  for (const table of tables) {
    const { error: childError } = await supabase.from(table as any).delete().in('claim_id', ids);
    if (childError) {
      return NextResponse.json({ error: `Failed deleting ${table}: ${childError.message}` }, { status: 500 });
    }
  }

  const { error } = await supabase.from('claims').delete().in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: ids.length });
}
