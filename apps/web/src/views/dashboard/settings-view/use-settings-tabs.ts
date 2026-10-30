import { useCurrentSubscription } from '@/api/subscription';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';
import {
  Bike,
  Bot,
  CreditCard,
  Heart,
  type LucideIcon,
  Mail,
  Plug,
  ShieldUser,
  Sparkles,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

export const SETTINGS_TAB_ICONS: Record<string, LucideIcon> = {
  connectors: Plug,
  profile: UserRound,
  equipment: Bike,
  training_zones: Zap,
  ai: Sparkles,
  agents: Bot,
  athletes: Users,
  coaches: ShieldUser,
  invitations: Mail,
  subscription: CreditCard,
  contribute: Heart,
};

const TRAINING_TABS = [
  'connectors',
  'training_zones',
  'equipment',
  'coaches',
  'athletes',
  'invitations',
];

/** The settings pages this user has, on this build of the app. */
export function useSettingsTabs() {
  const roles = useUserRoles();
  const { data: subscription, isPending: isLoadingSubscription } =
    useCurrentSubscription();
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
  const tabDescriptions: Record<string, string> = {
    connectors: m.connect_activity_tracking_services(),
    profile: m.update_profile_information(),
    equipment: m.equipment_tab_description(),
    training_zones: m.training_zones_tab_description(),
    ai: m.ai_settings_description(),
    agents: m.mcp_intro_description(),
    athletes: m.athletes_tab_description(),
    coaches: m.coaches_tab_description(),
    invitations: m.pending_invitations_description(),
  };

  // Same order and groups on the Me tab and the desktop sidebar
  const trainingTabs = TRAINING_TABS.filter((tab) => allowedTabs.includes(tab));
  const appTabs = allowedTabs.filter(
    (tab) => !TRAINING_TABS.includes(tab) && tab !== 'profile',
  );

  return {
    allowedTabs,
    trainingTabs,
    appTabs,
    tabLabels,
    tabDescriptions,
    isLoadingSubscription,
  };
}
