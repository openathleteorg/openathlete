import { m } from '@/paraglide/messages';
import RacePlanViewerView from '@/views/dashboard/race-plan-view/race-plan-viewer-view';

export function RacePlanViewerPage() {
  return (
    <>
      <title>{m.calendar()}</title>
      <RacePlanViewerView />
    </>
  );
}
