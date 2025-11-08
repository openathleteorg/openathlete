import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';

import { AthletesTab } from './athletes-tab';
import { CoachesTab } from './coaches-tab';
import { ConnectorsTab } from './connectors-tab';
import { EquipmentTab } from './equipment-tab';
import { InvitationsTab } from './invitations-tab';
import { ProfileTab } from './profile-tab';
import { TrainingZonesTab } from './training-zones-tab';

export function SettingsView() {
  const roles = useUserRoles();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">{m.settings()}</h1>
      <Tabs defaultValue="connectors" className="mt-4">
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
        </TabsList>
        <TabsContent value="connectors">
          <ConnectorsTab />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="equipment">
          <EquipmentTab />
        </TabsContent>
        <TabsContent value="training_zones">
          <TrainingZonesTab />
        </TabsContent>
        <TabsContent value="athletes">
          <AthletesTab />
        </TabsContent>
        <TabsContent value="coaches">
          <CoachesTab />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
