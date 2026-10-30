import { PageTitle } from '@/components/ui/page-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRoles } from '@/contexts/auth';
import { useAppBar } from '@/hooks/use-app-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubscriptionSettingsPage } from '@/pages/dashboard/settings/subscription';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useEffect, useMemo, useState } from 'react';
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
import { TrainingZonesTab } from './training-zones-tab';
import { useSettingsTabs } from './use-settings-tabs';

export function SettingsView() {
  const roles = useUserRoles();
  const { allowedTabs, tabLabels, showSubscription } = useSettingsTabs();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'connectors');

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

  const appBar = useMemo(
    () => ({ title: tabLabels[visibleTab], back: true }),
    [tabLabels[visibleTab]], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useAppBar(appBar);

  // On a phone, the Me tab is the list of settings
  if (isMobile && !tabParam) {
    return <Navigate to={getPath(['dashboard', 'profile'])} replace />;
  }

  return (
    <div className="w-full p-4 md:p-8">
      <PageTitle desktopOnly>{m.settings()}</PageTitle>
      <Tabs
        value={visibleTab}
        onValueChange={handleTabChange}
        className="md:mt-4"
      >
        <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <TabsList className="w-max md:w-auto flex-nowrap md:flex-wrap min-w-full md:min-w-0">
            <TabsTrigger value="connectors">{m.connectors()}</TabsTrigger>
            <TabsTrigger value="profile">{m.profile()}</TabsTrigger>
            <TabsTrigger value="equipment">{m.equipment()}</TabsTrigger>
            <TabsTrigger value="training_zones">
              {m.training_zones()}
            </TabsTrigger>
            <TabsTrigger value="ai">{m.ai_settings_tab()}</TabsTrigger>
            <TabsTrigger value="agents">{m.mcp_tab()}</TabsTrigger>
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
        <TabsContent value="connectors" className="md:mt-6">
          <ConnectorsTab />
        </TabsContent>
        <TabsContent value="profile" className="md:mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="equipment" className="md:mt-6">
          <EquipmentTab />
        </TabsContent>
        <TabsContent value="training_zones" className="md:mt-6">
          <TrainingZonesTab />
        </TabsContent>
        <TabsContent value="ai" className="md:mt-6">
          <AiTab />
        </TabsContent>
        <TabsContent value="agents" className="md:mt-6">
          <AgentsTab />
        </TabsContent>
        <TabsContent value="athletes" className="md:mt-6">
          <AthletesTab />
        </TabsContent>
        <TabsContent value="coaches" className="md:mt-6">
          <CoachesTab />
        </TabsContent>
        <TabsContent value="invitations" className="md:mt-6">
          <InvitationsTab />
        </TabsContent>
        {showSubscription && (
          <TabsContent value="subscription" className="md:mt-6">
            <SubscriptionSettingsPage />
          </TabsContent>
        )}
        <TabsContent value="contribute" className="md:mt-6">
          <ContributeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
