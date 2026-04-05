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
    console.error('share route unauthorized: no authenticated firm user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'examiner'].includes(firmUser.role)) {
    console.error('share route forbidden role:', firmUser.role);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: claimId } = await params;
  const body = (await request.json()) as ClaimShareRequest;
  const documentPaths = body.documentPaths ?? [];
  const recipientEmail = body.recipientEmail?.trim();
  const recipientName = body.recipientName?.trim();

  if (!recipientEmail || documentPaths.length === 0) {
    console.error('share route missing share details:', {
      claimId,
      recipientEmail,
      documentPathCount: documentPaths.length,
    });
    return NextResponse.json({ error: 'Missing share details' }, { status: 400 });
  }

  const documents = await getClaimDocuments(claimId);
  const allowedPaths = new Set(documents.reports.map((document) => document.path));
  const validPaths = documentPaths.filter((path) => allowedPaths.has(path));

  if (validPaths.length === 0) {
    console.error('share route no valid document paths:', {
      claimId,
      submittedPaths: documentPaths,
      allowedPaths: Array.from(allowedPaths),
    });
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
    console.error('share route firm user lookup failed:', {
      firmUserError,
      authUserId: firmUser.id,
      firmId: firmUser.firmId,
      firmUserRow,
    });
    return NextResponse.json({ error: 'Unable to resolve sharing user' }, { status: 500 });
  }

  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('claim_number, insured_name')
    .eq('id', claimId)
    .eq('firm_id', firmUser.firmId)
    .maybeSingle<ClaimRow>();

  if (claimError || !claim) {
    console.error('share route claim lookup failed:', {
      claimError,
      claimId,
      firmId: firmUser.firmId,
      claim,
    });
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
      created_by: firmUser.id,
      recipient_email: recipientEmail,
      recipient_name: recipientName || null,
      expires_at: expiresAt,
    });

  if (shareError) {
    console.error('share route claim_shares insert failed:', {
      shareError,
      claimId,
      createdBy: firmUserRow.id,
      recipientEmail,
      validPaths,
    });
    return NextResponse.json({ error: shareError.message }, { status: 500 });
  }

  console.error('share route sendgrid env check:', {
    hasApiKey: Boolean(process.env.SENDGRID_API_KEY),
    fromEmail: process.env.SENDGRID_FROM_EMAIL ?? null,
  });

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  try {
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
  } catch (error) {
    console.error('share route sendgrid send failed:', error);
    return NextResponse.json({ error: 'Unable to send share email' }, { status: 500 });
  }

  return NextResponse.json({ token });
}
