import { createAdminClient } from '@/lib/supabase/admin';

export interface ClaimInspectionData {
  inspection: {
    id: string;
    createdAt: string;
    data: Record<string, unknown> | null;
  } | null;
}

interface InspectionRow {
  id: string;
  data: Record<string, unknown> | null;
  created_at: string | null;
}

export async function getInspectionData(claimId: string): Promise<ClaimInspectionData> {
  const supabase = createAdminClient();

  const { data: inspectionRow, error: inspectionError } = await supabase
    .from('inspections')
    .select('id, data, created_at')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<InspectionRow>();

  if (inspectionError) {
    console.error('getInspectionData inspection error:', inspectionError);
  }

  return {
    inspection: inspectionRow
      ? {
          id: inspectionRow.id,
          createdAt: inspectionRow.created_at ?? '',
          data: inspectionRow.data ?? null,
        }
      : null,
  };
}
