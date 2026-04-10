import { redirect } from 'next/navigation';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function CalendarRoute() {
  const { firmId, id, role } = await requireAuthenticatedFirmUser();

  if (!['firm_admin', 'super_admin', 'dispatcher', 'adjuster'].includes(role)) {
    redirect('/dashboard');
  }

  return <CalendarPage firmId={firmId} adjusterUserId={id} />;
}
