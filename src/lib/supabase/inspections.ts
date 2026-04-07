import { createAdminClient } from '@/lib/supabase/admin';

export interface ClaimInspectionData {
  inspection: {
    id: string;
    createdAt: string;
    data: Record<string, unknown> | null;
  } | null;
  inspectionStarted: string;
  inspectionEnded: string;
}

interface InspectionRow {
  id: string;
  data: Record<string, unknown> | null;
  created_at: string | null;
}

interface PhotoTimestampRow {
  taken_at: string | null;
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
    throw new Error(`getInspectionData inspection error: ${inspectionError.message}`);
  }

  const { data: photoRows, error: photoError } = await supabase
    .from('photos')
    .select('taken_at')
    .eq('claim_id', claimId)
    .order('taken_at', { ascending: true });

  if (photoError) {
    throw new Error(`getInspectionData photos error: ${photoError.message}`);
  }

  const photoTimestamps = ((photoRows ?? []) as PhotoTimestampRow[])
    .map((row) => row.taken_at)
    .filter((value): value is string => Boolean(value));

  return {
    inspection: inspectionRow
      ? {
          id: inspectionRow.id,
          createdAt: inspectionRow.created_at ?? '',
          data: inspectionRow.data ?? null,
        }
      : null,
    inspectionStarted: photoTimestamps[0] ?? '',
    inspectionEnded: photoTimestamps[photoTimestamps.length - 1] ?? '',
  };
}
