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

import { SettingsSection } from './settings-section';

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
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="training-reminders">{m.training_reminders()}</Label>
          <p className="text-sm text-muted-foreground">
            {m.training_reminders_description()}
          </p>
        </div>
        <Switch
          id="training-reminders"
          checked={me?.trainingReminders ?? true}
          onCheckedChange={(trainingReminders) =>
            updateMutation.mutate({ trainingReminders })
          }
          disabled={!me || updateMutation.isPending}
        />
      </div>
      {permission === 'prompt' && (
        <Button
          variant="outline"
          className="mt-4 h-11 w-full"
          onClick={() => void enable()}
        >
          <Bell className="size-4" />
          {m.push_enable_on_device()}
        </Button>
      )}
      {permission === 'denied' && (
        <p className="mt-4 text-sm text-muted-foreground">
          {m.push_denied_hint()}
        </p>
      )}
    </SettingsSection>
  );
}
