import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRoles } from '@/contexts/auth';
import { SubscriptionSettingsPage } from '@/pages/dashboard/settings/subscription';
import { m } from '@/paraglide/messages';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AthletesTab } from './athletes-tab';
import { CoachesTab } from './coaches-tab';
import { ConnectorsTab } from './connectors-tab';
import { EquipmentTab } from './equipment-tab';
import { InvitationsTab } from './invitations-tab';
import { ProfileTab } from './profile-tab';
import { TrainingZonesTab } from './training-zones-tab';

export function SettingsView() {
  const roles = useUserRoles();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'connectors');

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
    <div className="p-8">
      <h1 className="text-2xl font-semibold">{m.settings()}</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
        <TabsList>
          <TabsTrigger value="connectors">{m.connectors()}</TabsTrigger>
          <TabsTrigger value="profile">{m.profile()}</TabsTrigger>
          <TabsTrigger value="equipment">{m.equipment()}</TabsTrigger>
          <TabsTrigger value="training_zones">{m.training_zones()}</TabsTrigger>
          {roles?.includes('COACH') && (
            <TabsTrigger value="athletes">{m.athletes()}</TabsTrigger>
          )}
          {roles?.includes('ATHLETE') && (
            <TabsTrigger value="coaches">{m.coaches()}</TabsTrigger>
          )}
          <TabsTrigger value="invitations">{m.invitations()}</TabsTrigger>
          <TabsTrigger value="subscription">{m.subscription()}</TabsTrigger>
        </TabsList>
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
        <TabsContent value="athletes" className="mt-6">
          <AthletesTab />
        </TabsContent>
        <TabsContent value="coaches" className="mt-6">
          <CoachesTab />
        </TabsContent>
        <TabsContent value="invitations" className="mt-6">
          <InvitationsTab />
        </TabsContent>
        <TabsContent value="subscription" className="mt-6">
          <SubscriptionSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
