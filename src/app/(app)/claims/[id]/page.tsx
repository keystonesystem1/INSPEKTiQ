import { redirect } from 'next/navigation';
import { getClaimById, getClaimContactsData } from '@/lib/supabase/claims';
import { getAdjusterOptions } from '@/lib/supabase/adjusters';
import { getClaimDocuments } from '@/lib/supabase/documents';
import { getInspectionData } from '@/lib/supabase/inspections';
import { getClaimNotes } from '@/lib/supabase/notes';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { Card } from '@/components/ui/Card';
import { ClaimHeader } from '@/components/claims/ClaimDetail/ClaimHeader';
import { MilestoneBar } from '@/components/claims/ClaimDetail/MilestoneBar';
import { ClaimTabs } from '@/components/claims/ClaimDetail/ClaimTabs';

function isIntakeReviewRequired(claim: NonNullable<Awaited<ReturnType<typeof getClaimById>>>) {
  return (
    claim.insured.trim() === 'Review Required' ||
    !claim.insured.trim() ||
    !claim.address.trim() ||
    !(claim.carrier ?? '').trim()
  );
}

export default async function ClaimDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { id: userId, role, firmId } = await requireAuthenticatedFirmUser();
  const [claim, adjusters, documents, inspection, notes, contacts] = await Promise.all([
    getClaimById(id, firmId, role, userId),
    getAdjusterOptions(firmId),
    getClaimDocuments(id),
    getInspectionData(id),
    getClaimNotes(id),
    getClaimContactsData(id, firmId),
  ]);

  if (!claim) redirect('/claims');
  const needsReview = isIntakeReviewRequired(claim);

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <Card style={{ background: 'var(--surface)' }}>
        {needsReview ? (
          <div
            style={{
              marginBottom: '14px',
              border: '1px solid rgba(224,123,63,0.35)',
              background: 'rgba(224,123,63,0.1)',
              color: 'var(--orange)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 12px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Intake data incomplete — review required.
          </div>
        ) : null}
        <ClaimHeader claim={claim} role={role} adjusters={adjusters} />
        <MilestoneBar claim={claim} />
      </Card>
      <ClaimTabs claim={claim} role={role} notes={notes} documents={documents} inspection={inspection} timeline={[]} contacts={contacts} initialTab={tab} />
    </div>
  );
}
