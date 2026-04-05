import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats(firmId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('claims')
    .select('status, created_at')
    .eq('firm_id', firmId)
    .eq('is_archived', false);

  const claims = data ?? [];

  return {
    active: claims.filter((claim) => !['closed', 'submitted'].includes(claim.status ?? '')).length,
    unassigned: claims.filter((claim) => claim.status === 'received').length,
    newToday: claims.filter((claim) => {
      const created = new Date(claim.created_at ?? '');
      const today = new Date();
      return created.toDateString() === today.toDateString();
    }).length,
    slaAtRisk: 0,
  };
}
