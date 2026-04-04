import { NextResponse } from 'next/server';

interface IntakePayload {
  from?: string;
  subject?: string;
  text?: string;
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
  const payload = (await request.json()) as IntakePayload;
  const subject = payload.subject ?? '';
  const text = payload.text ?? '';
  const from = payload.from ?? '';

  const record = {
    insured_name: text.match(/Insured:\s*(.+)/i)?.[1] ?? 'Unknown Insured',
    loss_address: text.match(/Address:\s*(.+)/i)?.[1] ?? 'Unknown Address',
    claim_number: parseClaimNumber(subject),
    carrier: parseCarrier(from),
    status: 'received',
    source: 'xactware_intake',
  };

  return NextResponse.json({
    success: true,
    message: 'Email intake parsed. Hook Supabase insert + realtime notifications here.',
    record,
  });
}
