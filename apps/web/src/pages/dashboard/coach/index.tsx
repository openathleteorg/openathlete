import { useSpaceContext } from '@/contexts/space';
import { m } from '@/paraglide/messages';
import { CoachDashboardView } from '@/views/dashboard/coach-dashboard-view';
import { useEffect } from 'react';

export function CoachDashboardPage() {
  const { space, setSpace } = useSpaceContext();
  // Reached from the athlete space's link: show the coach's sidebar. Only on
  // arrival: the switcher changes the space before leaving this page, and
  // reacting to that change would send the coach straight back here.
  useEffect(() => {
    if (space !== 'COACH') setSpace('COACH');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <title>{m.coach_dashboard()}</title>
      <CoachDashboardView />
    </>
  );
}

export default CoachDashboardPage;
