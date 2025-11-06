import { m } from '@/paraglide/messages';
import { CoachDashboardView } from '@/views/dashboard/coach-dashboard-view';

export function CoachDashboardPage() {
  return (
    <>
      <title>{m.coach_dashboard()}</title>
      <CoachDashboardView />
    </>
  );
}

export default CoachDashboardPage;


