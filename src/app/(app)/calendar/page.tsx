import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';
import { getClaims } from '@/lib/supabase/claims';
import { getAppointments } from '@/lib/supabase/appointments';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarView } from '@/components/calendar/CalendarView';

export default async function CalendarPage() {
  const { firmId, role, id: userId } = await requireAuthenticatedFirmUser();

  const [allClaims, appointments] = await Promise.all([
    getClaims(firmId, role, userId),
    getAppointments(firmId),
  ]);

  // Claims needing scheduling: assigned or contacted but not yet scheduled
  const needsScheduling = allClaims.filter(
    (claim) => claim.status === 'assigned' || claim.status === 'contacted',
  );

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Needs-scheduling queue, month view, and route map with smart routing context." />
      <CalendarView claims={needsScheduling} appointments={appointments} />
    </div>
  );
}
