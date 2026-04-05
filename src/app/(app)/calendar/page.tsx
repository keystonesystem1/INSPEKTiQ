import { CalendarPage } from '@/components/calendar/CalendarPage';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

export default async function CalendarRoute() {
  const { firmId, id } = await requireAuthenticatedFirmUser();

  return <CalendarPage firmId={firmId} adjusterUserId={id} />;
}
