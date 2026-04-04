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
}

function getFilename(path: string) {
  return path.split('/').filter(Boolean).pop() ?? path;
}

export async function getClaimDocuments(claimId: string): Promise<ClaimDocuments> {
  const supabase = createAdminClient();

  const { data: photoRows, error: photosError } = await supabase
    .from('photos')
    .select('storage_path, section')
    .eq('claim_id', claimId);

  if (photosError) {
    console.error('getClaimDocuments photos error:', photosError);
  }

  const validPhotoRows = ((photoRows ?? []) as PhotoRow[]).filter(
    (row): row is { storage_path: string; section: string | null } => Boolean(row.storage_path),
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
    .ilike('name', `%/${claimId}/%`);

  if (reportsError) {
    console.error('getClaimDocuments reports error:', reportsError);
  }

  const validReportRows = ((reportRows ?? []) as StorageObjectRow[]).filter((row) => Boolean(row.name));

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
