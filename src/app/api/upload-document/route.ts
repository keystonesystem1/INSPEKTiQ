import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface UploadTokenRow {
  id: string;
  token: string;
  claim_id: string;
  recipient_name: string | null;
  expires_at: string;
  used_at: string | null;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const claimId = String(formData.get('claimId') ?? '').trim();
  const token = String(formData.get('token') ?? '').trim();
  const providedFilename = String(formData.get('filename') ?? '').trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (!claimId || !token) {
    return NextResponse.json({ error: 'Missing claimId or token' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tokenRow, error: tokenError } = await supabase
    .from('upload_tokens')
    .select('id, token, claim_id, recipient_name, expires_at, used_at')
    .eq('token', token)
    .maybeSingle<UploadTokenRow>();

  if (tokenError) {
    return NextResponse.json({ error: tokenError.message }, { status: 500 });
  }
  if (!tokenRow) {
    return NextResponse.json({ error: 'Invalid upload token' }, { status: 404 });
  }
  if (tokenRow.claim_id !== claimId) {
    return NextResponse.json({ error: 'Token does not match claim' }, { status: 403 });
  }
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This upload link has expired.' }, { status: 410 });
  }

  const filename = providedFilename || file.name;
  const safeName = sanitizeFilename(filename);
  const storagePath = `uploads/${claimId}/${token}/${Date.now()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('claim-documents')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { error: docInsertError } = await supabase.from('claim_documents').insert({
    claim_id: claimId,
    filename,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: tokenRow.recipient_name ?? 'Upload Link',
    source: 'upload_link',
  });

  if (docInsertError) {
    return NextResponse.json(
      { error: `Uploaded, but metadata insert failed: ${docInsertError.message}` },
      { status: 500 },
    );
  }

  // Mark the token as used on first successful upload. We don't invalidate it
  // so the recipient can upload multiple files in one session until expiry.
  if (!tokenRow.used_at) {
    await supabase.from('upload_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id);
  }

  return NextResponse.json({ success: true, storagePath });
}
