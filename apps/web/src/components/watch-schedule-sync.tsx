import { useAuthContext } from '@/contexts/auth';
import { useWatchScheduleSync } from '@/hooks/use-watch-schedule-sync';
import { isAppleWatchScheduleAvailable } from '@/utils/watch-schedule';

/**
 * Side-effect only: refreshes Apple's schedule on foreground triggers while
 * the app is signed in on iPhone. It renders nothing and is inert elsewhere.
 * The inner component keeps the athlete request off the web and Android.
 */
export function WatchScheduleSync() {
  const { authenticated } = useAuthContext();
  if (!isAppleWatchScheduleAvailable() || !authenticated) return null;
  return <WatchScheduleSyncIOS />;
}

function WatchScheduleSyncIOS() {
  useWatchScheduleSync();
  return null;
}
