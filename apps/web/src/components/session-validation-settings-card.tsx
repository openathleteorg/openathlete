import {
  useGetAthleteSettingsQuery,
  useUpdateAthleteSettingsMutation,
} from '@/api/athlete';
import { LoadingScreen } from '@/components/loading-screen';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import { SettingsSection } from '@/views/dashboard/settings-view/settings-section';

interface P {
  athleteId: number;
}

export function SessionValidationSettingsCard({ athleteId }: P) {
  const { data: settings, isLoading } = useGetAthleteSettingsQuery(athleteId);
  const updateMutation = useUpdateAthleteSettingsMutation(athleteId);

  if (isLoading) return <LoadingScreen />;

  const handleToggleRpe = (checked: boolean) => {
    updateMutation.mutate({ requireRpe: checked });
  };

  const handleToggleComment = (checked: boolean) => {
    updateMutation.mutate({ requireComment: checked });
  };

  return (
    <SettingsSection
      title={m.session_validation_settings()}
      description={m.session_validation_settings_description()}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require-rpe">{m.require_rpe()}</Label>
            <p className="text-sm text-muted-foreground">
              {m.require_rpe_description()}
            </p>
          </div>
          <Switch
            id="require-rpe"
            checked={settings?.requireRpe ?? false}
            onCheckedChange={handleToggleRpe}
            disabled={updateMutation.isPending}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require-comment">{m.require_comment()}</Label>
            <p className="text-sm text-muted-foreground">
              {m.require_comment_description()}
            </p>
          </div>
          <Switch
            id="require-comment"
            checked={settings?.requireComment ?? false}
            onCheckedChange={handleToggleComment}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>
    </SettingsSection>
  );
}
