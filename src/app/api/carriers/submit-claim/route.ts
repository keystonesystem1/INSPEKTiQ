import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCarrierForFirmUser } from '@/lib/supabase/carriers';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  const firmUser = await getAuthenticatedFirmUser();
  if (!firmUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (firmUser.role !== 'carrier_admin' && firmUser.role !== 'carrier_desk_adjuster') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const carrier = await getCarrierForFirmUser(firmUser.id);
  if (!carrier) {
    return NextResponse.json({ error: 'No carrier associated with this account.' }, { status: 400 });
  }

  const formData = await request.formData();
  const insuredName = String(formData.get('insuredName') ?? '').trim();
  const policyNumber = String(formData.get('policyNumber') ?? '').trim();
  const dateOfLoss = String(formData.get('dateOfLoss') ?? '').trim();
  const lossType = String(formData.get('lossType') ?? '').trim();
  const lossAddress = String(formData.get('lossAddress') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const zip = String(formData.get('zip') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!insuredName || !policyNumber || !dateOfLoss) {
    return NextResponse.json({ error: 'Insured name, policy number, and date of loss are required.' }, { status: 400 });
  }

  const files = formData.getAll('files').filter((value): value is File => value instanceof File);
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File "${file.name}" exceeds the 50MB limit.` }, { status: 400 });
    }
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .insert({
      firm_id: carrier.firmId,
      carrier_id: carrier.id,
      carrier: carrier.name,
      insured_name: insuredName,
      policy_number: policyNumber,
      date_of_loss: dateOfLoss,
      loss_type: lossType || null,
      loss_address: lossAddress || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      loss_description: description || null,
      status: 'pending_acceptance',
      received_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id, claim_number, insured_name')
    .single();

  if (claimError || !claim) {
    return NextResponse.json({ error: claimError?.message ?? 'Unable to create claim.' }, { status: 500 });
  }

  const claimId = claim.id as string;
  const uploadedBy = carrier.name;

  for (const file of files) {
    const safeName = sanitizeFilename(file.name);
    const storagePath = `uploads/${claimId}/carrier/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('claim-documents')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json(
        { error: `Claim created, but file upload failed for "${file.name}": ${uploadError.message}`, claimId },
        { status: 500 },
      );
    }
    const { error: docInsertError } = await supabase.from('claim_documents').insert({
      claim_id: claimId,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: uploadedBy,
      source: 'carrier_portal',
    });
    if (docInsertError) {
      return NextResponse.json(
        { error: `Claim created and file uploaded, but metadata insert failed for "${file.name}": ${docInsertError.message}`, claimId },
        { status: 500 },
      );
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/claims');
  revalidatePath('/dispatch');

  return NextResponse.json({ success: true, claim });
}
