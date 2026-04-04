import { redirect } from 'next/navigation';
import { getClaimById } from '@/lib/supabase/claims';
import { getAdjusters } from '@/lib/supabase/adjusters';
import { getClaimDocuments } from '@/lib/supabase/documents';
import { getInspectionData } from '@/lib/supabase/inspections';
import { getClaimNotes } from '@/lib/supabase/notes';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { Card } from '@/components/ui/Card';
import { ClaimHeader } from '@/components/claims/ClaimDetail/ClaimHeader';
import { MilestoneBar } from '@/components/claims/ClaimDetail/MilestoneBar';
import { ClaimTabs } from '@/components/claims/ClaimDetail/ClaimTabs';

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { id: userId, role, firmId } = await requireAuthenticatedFirmUser();
  const claim = await getClaimById(id, firmId, role, userId);
  const adjusters = await getAdjusters(firmId);
  const documents = await getClaimDocuments(id);
  const inspection = await getInspectionData(id);
  const notes = await getClaimNotes(id);

  if (!claim) redirect('/claims');

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <Card style={{ background: 'var(--surface)' }}>
        <ClaimHeader claim={claim} role={role} adjusters={adjusters} />
        <MilestoneBar claim={claim} />
      </Card>
      <ClaimTabs claim={claim} role={role} notes={notes} documents={documents} inspection={inspection} timeline={[]} />
    </div>
  );
}
