import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface IntakePayload {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
}

const INTAKE_FIRM_ID = '919d3aed-3ae9-4feb-9b70-f2f8adbe314d';

function normalizeKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function parseLabelValueText(text: string) {
  const fields = new Map<string, string>();

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      continue;
    }

    fields.set(normalizeKey(match[1]), match[2].trim());
  }

  return {
    insuredName: fields.get('insured name') ?? fields.get('insured') ?? 'Review Required',
    policyNumber: fields.get('policy number') ?? '',
    dateOfLoss: fields.get('date of loss') ?? '',
    lossType: fields.get('loss type') ?? '',
    address: fields.get('address') ?? fields.get('loss address') ?? '',
    city: fields.get('city') ?? '',
    state: fields.get('state') ?? '',
    zip: fields.get('zip') ?? '',
    carrier: fields.get('carrier') ?? '',
    phone: fields.get('phone') ?? '',
    email: fields.get('email') ?? '',
    description: fields.get('description') ?? fields.get('loss description') ?? '',
  };
}

function parseClaimNumber(subject: string) {
  const match = subject.match(/[A-Z]{2}-\d{7}/);
  return match?.[0] ?? 'UNPARSED';
}

function parseCarrier(from: string) {
  if (from.includes('summit')) return 'Summit Commercial';
  if (from.includes('agri')) return 'AgriSure';
  return 'Lone Star Mutual';
}

function stripHyphens(value: string) {
  return value.replace(/-/g, '').toLowerCase();
}

/**
 * Extract the `+token` suffix from a To: address of the form
 * "Name <intake+TOKEN@parse.keystonestack.com>" or "intake+TOKEN@..."
 * Returns the raw token (hyphens preserved) or null if not present.
 */
function extractToToken(toField: string): string | null {
  if (!toField) return null;
  const addrMatch = toField.match(/<([^>]+)>/) ?? [null, toField];
  const addr = addrMatch[1]?.trim() ?? toField.trim();
  const atIndex = addr.indexOf('@');
  if (atIndex < 0) return null;
  const localPart = addr.slice(0, atIndex);
  const plusIndex = localPart.indexOf('+');
  if (plusIndex < 0) return null;
  const token = localPart.slice(plusIndex + 1).trim();
  return token || null;
}

interface ResolvedCarrier {
  id: string;
  firmId: string;
  name: string;
}

async function resolveCarrierByToken(token: string): Promise<ResolvedCarrier | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('id, firm_id, name, intake_token')
    .not('intake_token', 'is', null);
  if (error || !data) return null;

  const normalizedToken = stripHyphens(token);
  const match = (data as Array<{ id: string; firm_id: string; name: string; intake_token: string | null }>).find(
    (row) => row.intake_token && stripHyphens(row.intake_token) === normalizedToken,
  );
  if (!match) return null;
  return { id: match.id, firmId: match.firm_id, name: match.name };
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Pull File entries out of the SendGrid multipart form. SendGrid inbound parse
 * sends attachments as `attachment1`, `attachment2`, ... or occasionally as
 * generic File entries. Accept either pattern by iterating all entries.
 */
function collectAttachments(formData: FormData): File[] {
  const files: File[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  return files;
}

async function uploadAttachments(claimId: string, files: File[]) {
  if (!files.length) return;
  const supabase = createAdminClient();
  for (const file of files) {
    const safeName = sanitizeFilename(file.name);
    const storagePath = `uploads/${claimId}/email/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('claim-documents')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (uploadError) continue;
    await supabase.from('claim_documents').insert({
      claim_id: claimId,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: 'Email Intake',
      source: 'email_intake',
    });
  }
}

export async function POST(request: Request) {
  let payload: IntakePayload;
  let attachments: File[] = [];
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    payload = (await request.json()) as IntakePayload;
  } else {
    const formData = await request.formData();
    payload = {
      from: String(formData.get('from') ?? ''),
      to: String(formData.get('to') ?? ''),
      subject: String(formData.get('subject') ?? ''),
      text: String(formData.get('text') ?? formData.get('body-plain') ?? ''),
    };
    attachments = collectAttachments(formData);
  }

  const subject = payload.subject ?? '';
  const text = payload.text ?? '';
  const from = payload.from ?? '';
  const to = payload.to ?? '';
  const parsed = parseLabelValueText(text);
  const now = new Date().toISOString();

  // Try per-carrier routing first via the +token suffix in the To: address.
  let carrierMatch: ResolvedCarrier | null = null;
  const token = extractToToken(to);
  if (token) {
    carrierMatch = await resolveCarrierByToken(token);
  }

  const baseRecord = {
    insured_name: parsed.insuredName,
    insured_phone: parsed.phone || null,
    insured_email: parsed.email || null,
    loss_address: parsed.address || null,
    city: parsed.city || null,
    state: parsed.state || null,
    zip: parsed.zip || null,
    claim_number: parseClaimNumber(subject),
    loss_type: parsed.lossType || null,
    date_of_loss: parsed.dateOfLoss || null,
    policy_number: parsed.policyNumber || null,
    loss_description: parsed.description || null,
    received_at: now,
    created_at: now,
    updated_at: now,
  };

  const record = carrierMatch
    ? {
        ...baseRecord,
        firm_id: carrierMatch.firmId,
        carrier_id: carrierMatch.id,
        carrier: carrierMatch.name,
        status: 'pending_acceptance',
      }
    : {
        ...baseRecord,
        firm_id: INTAKE_FIRM_ID,
        carrier: parsed.carrier || parseCarrier(from),
        status: 'received',
      };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claims')
    .insert(record)
    .select('id, claim_number, insured_name, carrier, loss_address, policy_number')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.id) {
    await uploadAttachments(data.id as string, attachments);
  }

  return NextResponse.json({
    success: true,
    record: data,
    routedTo: carrierMatch ? { carrierId: carrierMatch.id, carrierName: carrierMatch.name } : 'firm_intake',
    attachmentsProcessed: attachments.length,
  });
}
