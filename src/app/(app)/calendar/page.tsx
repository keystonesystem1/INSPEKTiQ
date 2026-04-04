import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar" subtitle="Needs-scheduling queue, month view, and route map with smart routing context." />
      <CalendarView />
    </div>
  );
}
