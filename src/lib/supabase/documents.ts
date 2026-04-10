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

function getPublicClaimDocumentUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/claim-documents/${path}`;
}

async function getGeneratedReportSignedUrl(path: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from('generated-reports')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function resolveDocumentUrl(path: string) {
  if (path.startsWith('uploads/')) {
    return getPublicClaimDocumentUrl(path);
  }

  const generatedReportUrl = await getGeneratedReportSignedUrl(path);
  if (generatedReportUrl) {
    return generatedReportUrl;
  }

  return getPublicClaimDocumentUrl(path);
}

export async function getClaimDocuments(claimId: string): Promise<ClaimDocuments> {
  const supabase = createAdminClient();

  const { data: photoRows, error: photosError } = await supabase
    .from('photos')
    .select('storage_path, section, subsection, label, caption')
    .eq('claim_id', claimId);

  if (photosError) {
    throw new Error(`getClaimDocuments photos error: ${photosError.message}`);
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

  const { data: rootFolders, error: rootFoldersError } = await supabase.storage
    .from('generated-reports')
    .list('', { limit: 100 });

  if (rootFoldersError) {
    throw new Error(`getClaimDocuments generated-reports list error: ${rootFoldersError.message}`);
  }

  const reports: ClaimReportDocument[] = [];

  for (const folder of rootFolders ?? []) {
    const { data: claimFiles } = await supabase.storage
      .from('generated-reports')
      .list(`${folder.name}/${claimId}`, { limit: 50 });

    for (const file of claimFiles ?? []) {
      if (!file.name.toLowerCase().endsWith('.pdf')) continue;
      const filePath = `${folder.name}/${claimId}/${file.name}`;
      const { data: signedData } = await supabase.storage
        .from('generated-reports')
        .createSignedUrl(filePath, 60 * 60);
      if (signedData?.signedUrl) {
        reports.push({
          path: filePath,
          filename: file.name,
          signedUrl: signedData.signedUrl,
          createdAt: file.created_at ?? undefined,
        });
      }
    }
  }

  const { data: claimDocumentRootFolders, error: claimDocumentRootError } = await supabase.storage
    .from('claim-documents')
    .list('', { limit: 100 });

  if (claimDocumentRootError) {
    throw new Error(`getClaimDocuments claim-documents list error: ${claimDocumentRootError.message}`);
  }

  for (const folder of claimDocumentRootFolders ?? []) {
    if (folder.name === 'uploads') {
      const { data: uploadFolders, error: uploadsError } = await supabase.storage
        .from('claim-documents')
        .list(`uploads/${claimId}`, { limit: 100 });

      if (uploadsError) {
        throw new Error(`getClaimDocuments uploads list error: ${uploadsError.message}`);
      }

      for (const uploadFolder of uploadFolders ?? []) {
        const { data: uploadFiles } = await supabase.storage
          .from('claim-documents')
          .list(`uploads/${claimId}/${uploadFolder.name}`, { limit: 100 });

        for (const file of uploadFiles ?? []) {
          const filePath = `uploads/${claimId}/${uploadFolder.name}/${file.name}`;
          reports.push({
            path: filePath,
            filename: file.name,
            signedUrl: getPublicClaimDocumentUrl(filePath),
            createdAt: file.created_at ?? undefined,
          });
        }
      }

      continue;
    }

    const { data: claimFiles, error: claimFilesError } = await supabase.storage
      .from('claim-documents')
      .list(`${folder.name}/${claimId}`, { limit: 100 });

    if (claimFilesError) {
      throw new Error(`getClaimDocuments user folder list error: ${claimFilesError.message}`);
    }

    const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.heic', '.heif', '.gif', '.webp', '.doc', '.docx', '.xls', '.xlsx']);
    for (const file of claimFiles ?? []) {
      const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;
      const filePath = `${folder.name}/${claimId}/${file.name}`;
      reports.push({
        path: filePath,
        filename: file.name,
        signedUrl: getPublicClaimDocumentUrl(filePath),
        createdAt: file.created_at ?? undefined,
      });
    }
  }

  return { reports, photos };
}
