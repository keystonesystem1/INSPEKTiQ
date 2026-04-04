import { notFound } from 'next/navigation';
import { demoClaims, demoNotes, demoTimeline } from '@/lib/utils/demo-data';
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
  const claim = demoClaims.find((item) => item.id === id);
  const { role } = await requireAuthenticatedFirmUser();

  if (!claim) notFound();

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <Card style={{ background: 'var(--surface)' }}>
        <ClaimHeader claim={claim} role={role} />
        <MilestoneBar claim={claim} />
      </Card>
      <ClaimTabs claim={claim} role={role} notes={demoNotes} timeline={demoTimeline} />
    </div>
  );
}
