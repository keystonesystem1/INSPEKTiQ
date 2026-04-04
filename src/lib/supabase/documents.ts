import { createAdminClient } from '@/lib/supabase/admin';

export interface ClaimReportDocument {
  path: string;
  filename: string;
  signedUrl: string;
  createdAt?: string;
}

export interface ClaimPhotoDocument {
  path: string;
  filename: string;
  section: string;
  subsection: string;
  label: string;
  caption: string;
  signedUrl: string;
}

export interface ClaimDocuments {
  reports: ClaimReportDocument[];
  photos: ClaimPhotoDocument[];
}

interface StorageObjectRow {
  name: string;
  created_at?: string | null;
}

interface PhotoRow {
  storage_path: string | null;
  section: string | null;
  subsection: string | null;
  label: string | null;
  caption: string | null;
}

function getFilename(path: string) {
  return path.split('/').filter(Boolean).pop() ?? path;
}

export async function getClaimDocuments(claimId: string): Promise<ClaimDocuments> {
  const supabase = createAdminClient();

  const { data: photoRows, error: photosError } = await supabase
    .from('photos')
    .select('storage_path, section, subsection, label, caption')
    .eq('claim_id', claimId);

  if (photosError) {
    console.error('getClaimDocuments photos error:', photosError);
  }

  const validPhotoRows = ((photoRows ?? []) as PhotoRow[]).filter(
    (row): row is PhotoRow & { storage_path: string } => Boolean(row.storage_path),
  );

  const photoSignedResults = await Promise.all(
    validPhotoRows.map(async (row) => {
      const { data } = await supabase.storage
        .from('claim-photos')
        .createSignedUrl(row.storage_path, 60 * 60);

      return {
        path: row.storage_path,
        filename: getFilename(row.storage_path),
        section: row.section ?? 'Other',
        subsection: row.subsection ?? '',
        label: row.label ?? getFilename(row.storage_path),
        caption: row.caption ?? '',
        signedUrl: data?.signedUrl ?? '',
      };
    }),
  );

  const photos = photoSignedResults.filter((photo) => photo.signedUrl);

  const { data: reportRows, error: reportsError } = await supabase
    .schema('storage')
    .from('objects')
    .select('name, created_at')
    .eq('bucket_id', 'generated-reports')
    .limit(1000);

  if (reportsError) {
    console.error('getClaimDocuments reports error:', reportsError);
  }

  const validReportRows = ((reportRows ?? []) as StorageObjectRow[]).filter((row) => {
    if (!row.name) {
      return false;
    }

    const [, pathClaimId] = row.name.split('/');
    return pathClaimId === claimId && row.name.toLowerCase().endsWith('.pdf');
  });

  const reportSignedResults = await Promise.all(
    validReportRows.map(async (row) => {
      const { data } = await supabase.storage
        .from('generated-reports')
        .createSignedUrl(row.name, 60 * 60);

      return {
        path: row.name,
        filename: getFilename(row.name),
        signedUrl: data?.signedUrl ?? '',
        createdAt: row.created_at ?? undefined,
      };
    }),
  );

  const reports = reportSignedResults.filter((report) => report.signedUrl);

  return { reports, photos };
}
