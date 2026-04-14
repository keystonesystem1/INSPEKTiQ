import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  }

  // Delete in dependency order — children before parent
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
    await supabase.from(table as any).delete().in('claim_id', ids);
  }

  const { error } = await supabase.from('claims').delete().in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: ids.length });
}
