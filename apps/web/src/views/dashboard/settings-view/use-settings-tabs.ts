import { useCurrentSubscription } from '@/api/subscription';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';

/** The settings pages this user has, on this build of the app. */
export function useSettingsTabs() {
  const roles = useUserRoles();
  const { data: subscription } = useCurrentSubscription();
  // Nothing to subscribe to on instances without billing, nor in the
  // Android app; the iOS app sells through the App Store when it is set up
  const channel = purchaseChannel();
  const showSubscription =
    Boolean(subscription?.billingEnabled) &&
    (channel === 'stripe' ||
      (channel === 'app-store' && Boolean(subscription?.appStoreEnabled)));

  const allowedTabs = [
    'connectors',
    'profile',
    'equipment',
    'training_zones',
    'ai',
    'agents',
    ...(roles?.includes('COACH') ? ['athletes'] : []),
    ...(roles?.includes('ATHLETE') ? ['coaches'] : []),
    'invitations',
    ...(showSubscription ? ['subscription'] : []),
    'contribute',
  ];
  const tabLabels: Record<string, string> = {
    connectors: m.connectors(),
    profile: m.profile(),
    equipment: m.equipment(),
    training_zones: m.training_zones(),
    ai: m.ai_settings_tab(),
    agents: m.mcp_tab(),
    athletes: m.athletes(),
    coaches: m.coaches(),
    invitations: m.invitations(),
    subscription: m.subscription(),
    contribute: m.contribute(),
  };

  return { allowedTabs, tabLabels, showSubscription };
}
