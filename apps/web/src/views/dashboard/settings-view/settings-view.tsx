import { LoadingScreen } from '@/components/loading-screen';
import { PageTitle } from '@/components/ui/page-title';
import { useAppBar } from '@/hooks/use-app-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubscriptionSettingsPage } from '@/pages/dashboard/settings/subscription';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { ComponentType, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { AgentsTab } from './agents/agents-tab';
import { AiTab } from './ai/ai-tab';
import { AthletesTab } from './athletes-tab';
import { CoachesTab } from './coaches-tab';
import { ConnectorsTab } from './connectors-tab';
import { ContributeTab } from './contribute-tab';
import { EquipmentTab } from './equipment-tab';
import { InvitationsTab } from './invitations-tab';
import { ProfileTab } from './profile-tab';
import { SettingsNav } from './settings-nav';
import { TrainingZonesTab } from './training-zones-tab';
import { useSettingsTabs } from './use-settings-tabs';

const TAB_PAGES: Record<string, ComponentType> = {
  connectors: ConnectorsTab,
  profile: ProfileTab,
  equipment: EquipmentTab,
  training_zones: TrainingZonesTab,
  ai: AiTab,
  agents: AgentsTab,
  athletes: AthletesTab,
  coaches: CoachesTab,
  invitations: InvitationsTab,
  subscription: SubscriptionSettingsPage,
  contribute: ContributeTab,
};

// Settings are full of small controls: on a phone they all reach 44 px, without
// each page sizing its own. Radix triggers replace data-slot, hence the role:
// only switches, checkboxes and the like have one, and they keep their size
const TOUCH_TARGETS =
  'max-md:[&_button:not([role])]:h-11 max-md:[&_a[data-slot=button]]:h-11 max-md:[&_[data-slot=input]]:h-11 max-md:[&_[data-slot=select-trigger]]:h-11 max-md:[&_[data-slot=tabs-list]]:h-11 max-md:[&_[data-slot=tabs-trigger]]:h-9';

export function SettingsView() {
  const { allowedTabs, tabLabels, tabDescriptions, isLoadingSubscription } =
    useSettingsTabs();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const visibleTab = allowedTabs.includes(tabParam ?? '')
    ? tabParam!
    : 'connectors';
  // The subscription page is only known once the plan is: Stripe sends people
  // back to it, and they should not see the connectors for a moment
  const waitingForTab = tabParam === 'subscription' && isLoadingSubscription;

  const appBar = useMemo(
    () => ({ title: tabLabels[visibleTab], back: true }),
    [tabLabels[visibleTab]], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useAppBar(appBar);

  // On a phone, the Me tab is the list of settings
  if (isMobile && !tabParam) {
    return <Navigate to={getPath(['dashboard', 'profile'])} replace />;
  }

  const Page = TAB_PAGES[visibleTab];
  const description = tabDescriptions[visibleTab];

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-8 xl:flex-row xl:items-start xl:gap-14">
      <SettingsNav activeTab={visibleTab} />
      <div className="w-full max-w-3xl min-w-0 flex-1">
        {waitingForTab ? (
          <LoadingScreen />
        ) : (
          <>
            <header
              className={cn(
                'mb-6 px-1 md:mb-8',
                !description && 'max-md:hidden',
              )}
            >
              <PageTitle desktopOnly>{tabLabels[visibleTab]}</PageTitle>
              {description && (
                <p className="text-sm text-muted-foreground md:mt-1">
                  {description}
                </p>
              )}
            </header>
            <div className={TOUCH_TARGETS}>
              <Page />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
