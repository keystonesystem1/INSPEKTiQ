import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Appointment } from '@/lib/types';

interface AppointmentRow {
  id: string;
  claim_id: string;
  firm_id: string;
  adjuster_user_id: string | null;
  date: string;
  arrival_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  claims: { insured_name: string | null; loss_address: string | null } | null;
}

function mapAppointmentRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    claimId: row.claim_id,
    insured: row.claims?.insured_name ?? 'Unknown',
    address: row.claims?.loss_address ?? '',
    date: row.date,
    arrivalTime: row.arrival_time?.slice(0, 5) ?? '',
    endTime: row.end_time?.slice(0, 5) ?? '',
    status: row.status as Appointment['status'],
    adjuster: '',
  };
}

export async function getAppointments(firmId: string): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, claim_id, firm_id, adjuster_user_id, date, arrival_time, end_time, status, notes, claims(insured_name, loss_address)')
    .eq('firm_id', firmId)
    .order('date', { ascending: true });

  if (error) {
    console.error('getAppointments error:', error);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapAppointmentRow(row as AppointmentRow));
}

export async function createAppointment(data: {
  claimId: string;
  firmId: string;
  adjusterUserId?: string;
  date: string;
  arrivalTime: string;
  endTime: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error: insertError } = await supabase
    .from('appointments')
    .insert({
      claim_id: data.claimId,
      firm_id: data.firmId,
      adjuster_user_id: data.adjusterUserId ?? null,
      date: data.date,
      arrival_time: data.arrivalTime,
      end_time: data.endTime,
      notes: data.notes ?? null,
      status: 'pending',
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Update claim status to 'scheduled' if it's currently 'assigned' or 'contacted'
  await supabase
    .from('claims')
    .update({ status: 'scheduled', updated_at: new Date().toISOString() })
    .eq('id', data.claimId)
    .in('status', ['assigned', 'contacted']);

  return { success: true };
}
