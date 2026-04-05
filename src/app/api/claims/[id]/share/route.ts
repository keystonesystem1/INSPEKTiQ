import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClaimDocuments } from '@/lib/supabase/documents';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';

interface ClaimShareRequest {
  documentPaths?: string[];
  recipientEmail?: string;
  recipientName?: string;
}

interface FirmUserRow {
  id: string;
}

interface ClaimRow {
  claim_number: string | null;
  insured_name: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'examiner'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: claimId } = await params;
  const body = (await request.json()) as ClaimShareRequest;
  const documentPaths = body.documentPaths ?? [];
  const recipientEmail = body.recipientEmail?.trim();
  const recipientName = body.recipientName?.trim();

  if (!recipientEmail || documentPaths.length === 0) {
    return NextResponse.json({ error: 'Missing share details' }, { status: 400 });
  }

  const documents = await getClaimDocuments(claimId);
  const allowedPaths = new Set(documents.reports.map((document) => document.path));
  const validPaths = documentPaths.filter((path) => allowedPaths.has(path));

  if (validPaths.length === 0) {
    return NextResponse.json({ error: 'No valid documents selected' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: firmUserRow, error: firmUserError } = await supabase
    .from('firm_users')
    .select('id')
    .eq('firm_id', firmUser.firmId)
    .eq('user_id', firmUser.id)
    .maybeSingle<FirmUserRow>();

  if (firmUserError || !firmUserRow) {
    return NextResponse.json({ error: 'Unable to resolve sharing user' }, { status: 500 });
  }

  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('claim_number, insured_name')
    .eq('id', claimId)
    .eq('firm_id', firmUser.firmId)
    .maybeSingle<ClaimRow>();

  if (claimError || !claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: shareError } = await supabase
    .from('claim_shares')
    .insert({
      token,
      claim_id: claimId,
      document_paths: validPaths,
      created_by: firmUserRow.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName || null,
      expires_at: expiresAt,
    });

  if (shareError) {
    return NextResponse.json({ error: shareError.message }, { status: 500 });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  await sgMail.send({
    to: recipientEmail,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: `Claim Documents Ready — ${claim.claim_number ?? 'Claim'} | ${claim.insured_name ?? 'Insured'}`,
    text: `${recipientName || 'Hello'},

Documents for claim ${claim.claim_number ?? 'Claim'} — ${claim.insured_name ?? 'Insured'} are ready for your review.

View and download documents:
https://www.inspektiq.io/share/${token}

This link expires in 30 days.

Keystone Adjusting
Powered by Keystone Stack`,
  });

  return NextResponse.json({ token });
}
