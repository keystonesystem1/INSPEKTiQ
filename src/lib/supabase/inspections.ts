import { createAdminClient } from '@/lib/supabase/admin';

export interface InspectionPhoto {
  id: string;
  section: string;
  subsection: string;
  label: string;
  caption: string;
  takenAt: string;
  signedUrl: string;
}

export interface InspectionSection {
  section: string;
  photos: InspectionPhoto[];
}

export interface ClaimInspectionData {
  inspection: {
    id: string;
    createdAt: string;
    data: Record<string, unknown> | null;
  } | null;
  sections: InspectionSection[];
}

interface InspectionRow {
  id: string;
  data: Record<string, unknown> | null;
  created_at: string | null;
}

interface PhotoRow {
  id: string;
  storage_path: string | null;
  section: string | null;
  subsection: string | null;
  label: string | null;
  caption: string | null;
  taken_at: string | null;
}

function getFilename(path: string) {
  return path.split('/').filter(Boolean).pop() ?? path;
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

  const { data: photoRows, error: photoError } = await supabase
    .from('photos')
    .select('id, storage_path, section, subsection, label, caption, taken_at')
    .eq('claim_id', claimId)
    .order('section', { ascending: true })
    .order('taken_at', { ascending: true });

  if (photoError) {
    console.error('getInspectionData photos error:', photoError);
  }

  const signedPhotos = await Promise.all(
    ((photoRows ?? []) as PhotoRow[])
      .filter((row): row is PhotoRow & { storage_path: string } => Boolean(row.storage_path))
      .map(async (row) => {
        const { data } = await supabase.storage
          .from('claim-photos')
          .createSignedUrl(row.storage_path, 60 * 60);

        return {
          id: row.id,
          section: row.section ?? 'Other',
          subsection: row.subsection ?? '',
          label: row.label ?? getFilename(row.storage_path),
          caption: row.caption ?? '',
          takenAt: row.taken_at ?? '',
          signedUrl: data?.signedUrl ?? '',
        };
      }),
  );

  const sectionsMap = new Map<string, InspectionPhoto[]>();

  signedPhotos
    .filter((photo) => photo.signedUrl)
    .forEach((photo) => {
      const existing = sectionsMap.get(photo.section) ?? [];
      existing.push(photo);
      sectionsMap.set(photo.section, existing);
    });

  return {
    inspection: inspectionRow
      ? {
          id: inspectionRow.id,
          createdAt: inspectionRow.created_at ?? '',
          data: inspectionRow.data ?? null,
        }
      : null,
    sections: Array.from(sectionsMap.entries()).map(([section, photos]) => ({
      section,
      photos,
    })),
  };
}
