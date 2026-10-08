import { useCurrentSubscription } from '@/api/subscription';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRoles } from '@/contexts/auth';
import { SubscriptionSettingsPage } from '@/pages/dashboard/settings/subscription';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AiTab } from './ai/ai-tab';
import { AthletesTab } from './athletes-tab';
import { CoachesTab } from './coaches-tab';
import { ConnectorsTab } from './connectors-tab';
import { ContributeTab } from './contribute-tab';
import { EquipmentTab } from './equipment-tab';
import { InvitationsTab } from './invitations-tab';
import { ProfileTab } from './profile-tab';
import { TrainingZonesTab } from './training-zones-tab';

export function SettingsView() {
  const roles = useUserRoles();
  const { data: subscription } = useCurrentSubscription();
  // Nothing to subscribe to on instances without billing, nor in the
  // Android app; the iOS app sells through the App Store when it is set up
  const channel = purchaseChannel();
  const showSubscription =
    Boolean(subscription?.billingEnabled) &&
    (channel === 'stripe' ||
      (channel === 'app-store' && Boolean(subscription?.appStoreEnabled)));
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'connectors');

  const allowedTabs = [
    'connectors',
    'profile',
    'equipment',
    'training_zones',
    'ai',
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
    athletes: m.athletes(),
    coaches: m.coaches(),
    invitations: m.invitations(),
    subscription: m.subscription(),
    contribute: m.contribute(),
  };
  const visibleTab = allowedTabs.includes(activeTab) ? activeTab : 'connectors';

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="w-full p-4 md:p-8">
      <h1 className="text-2xl font-semibold hidden md:block">{m.settings()}</h1>
      <Tabs value={visibleTab} onValueChange={handleTabChange} className="mt-4">
        <label className="block md:hidden">
          <span className="sr-only">{m.settings()}</span>
          <select
            data-mobile-settings-select
            className="h-12 w-full rounded-md border bg-background px-3 text-base text-foreground"
            value={visibleTab}
            onChange={(event) => handleTabChange(event.target.value)}
          >
            {allowedTabs.map((tab) => (
              <option key={tab} value={tab}>
                {tabLabels[tab]}
              </option>
            ))}
          </select>
        </label>
        <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <TabsList className="w-max md:w-auto flex-nowrap md:flex-wrap min-w-full md:min-w-0">
            <TabsTrigger value="connectors">{m.connectors()}</TabsTrigger>
            <TabsTrigger value="profile">{m.profile()}</TabsTrigger>
            <TabsTrigger value="equipment">{m.equipment()}</TabsTrigger>
            <TabsTrigger value="training_zones">
              {m.training_zones()}
            </TabsTrigger>
            <TabsTrigger value="ai">{m.ai_settings_tab()}</TabsTrigger>
            {roles?.includes('COACH') && (
              <TabsTrigger value="athletes">{m.athletes()}</TabsTrigger>
            )}
            {roles?.includes('ATHLETE') && (
              <TabsTrigger value="coaches">{m.coaches()}</TabsTrigger>
            )}
            <TabsTrigger value="invitations">{m.invitations()}</TabsTrigger>
            {showSubscription && (
              <TabsTrigger value="subscription">{m.subscription()}</TabsTrigger>
            )}
            <TabsTrigger value="contribute">{m.contribute()}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="connectors" className="mt-6">
          <ConnectorsTab />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="equipment" className="mt-6">
          <EquipmentTab />
        </TabsContent>
        <TabsContent value="training_zones" className="mt-6">
          <TrainingZonesTab />
        </TabsContent>
        <TabsContent value="ai" className="mt-6">
          <AiTab />
        </TabsContent>
        <TabsContent value="athletes" className="mt-6">
          <AthletesTab />
        </TabsContent>
        <TabsContent value="coaches" className="mt-6">
          <CoachesTab />
        </TabsContent>
        <TabsContent value="invitations" className="mt-6">
          <InvitationsTab />
        </TabsContent>
        {showSubscription && (
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionSettingsPage />
          </TabsContent>
        )}
        <TabsContent value="contribute" className="mt-6">
          <ContributeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
