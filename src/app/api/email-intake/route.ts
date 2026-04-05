import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface IntakePayload {
  from?: string;
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

export async function POST(request: Request) {
  let payload: IntakePayload;
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    payload = (await request.json()) as IntakePayload;
  } else {
    const formData = await request.formData();
    payload = {
      from: String(formData.get('from') ?? ''),
      subject: String(formData.get('subject') ?? ''),
      text: String(formData.get('text') ?? formData.get('body-plain') ?? ''),
    };
  }

  const subject = payload.subject ?? '';
  const text = payload.text ?? '';
  const from = payload.from ?? '';
  const parsed = parseLabelValueText(text);
  const now = new Date().toISOString();

  const record = {
    insured_name: parsed.insuredName,
    insured_phone: parsed.phone || null,
    insured_email: parsed.email || null,
    loss_address: parsed.address || null,
    city: parsed.city || null,
    state: parsed.state || null,
    zip: parsed.zip || null,
    claim_number: parseClaimNumber(subject),
    carrier: parsed.carrier || parseCarrier(from),
    loss_type: parsed.lossType || null,
    date_of_loss: parsed.dateOfLoss || null,
    policy_number: parsed.policyNumber || null,
    loss_description: parsed.description || null,
    status: 'received',
    firm_id: INTAKE_FIRM_ID,
    received_at: now,
    created_at: now,
    updated_at: now,
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

  return NextResponse.json({
    success: true,
    record: data,
  });
}
