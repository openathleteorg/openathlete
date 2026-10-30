import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePushPermission } from '@/hooks/use-push-permission';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from './settings-section';

/** The evening push reminder of the next day's planned sessions. */
export function TrainingRemindersSection() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const { permission, enable } = usePushPermission();
  const updateMutation = useUpdateAccountMutation({
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [userKeys.getMe] }),
    onError: () => toast.error(m.training_reminders_update_failed()),
  });

  return (
    <SettingsSection title={m.notifications()}>
      <SettingsPanel>
        <SettingsRow
          title={
            <Label htmlFor="training-reminders">{m.training_reminders()}</Label>
          }
          description={m.training_reminders_description()}
        >
          <Switch
            id="training-reminders"
            checked={me?.trainingReminders ?? true}
            onCheckedChange={(trainingReminders) =>
              updateMutation.mutate({ trainingReminders })
            }
            disabled={!me || updateMutation.isPending}
          />
        </SettingsRow>
        {permission === 'prompt' && (
          <div className="p-3">
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => void enable()}
            >
              <Bell className="size-4" />
              {m.push_enable_on_device()}
            </Button>
          </div>
        )}
        {permission === 'denied' && (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            {m.push_denied_hint()}
          </p>
        )}
      </SettingsPanel>
    </SettingsSection>
  );
}
