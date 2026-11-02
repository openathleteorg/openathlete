import {
  useGetAthleteSettingsQuery,
  useUpdateAthleteSettingsMutation,
} from '@/api/athlete';
import { LoadingScreen } from '@/components/loading-screen';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from '@/views/dashboard/settings-view/settings-section';

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

  const handleToggleFeedbackQuestions = (checked: boolean) => {
    updateMutation.mutate({ requireFeedbackQuestions: checked });
  };

  return (
    <SettingsSection
      title={m.session_validation_settings()}
      description={m.session_validation_settings_description()}
    >
      <SettingsPanel>
        <SettingsRow
          title={<Label htmlFor="require-rpe">{m.require_rpe()}</Label>}
          description={m.require_rpe_description()}
        >
          <Switch
            id="require-rpe"
            checked={settings?.requireRpe ?? false}
            onCheckedChange={handleToggleRpe}
            disabled={updateMutation.isPending}
          />
        </SettingsRow>
        <SettingsRow
          title={<Label htmlFor="require-comment">{m.require_comment()}</Label>}
          description={m.require_comment_description()}
        >
          <Switch
            id="require-comment"
            checked={settings?.requireComment ?? false}
            onCheckedChange={handleToggleComment}
            disabled={updateMutation.isPending}
          />
        </SettingsRow>
        <SettingsRow
          title={
            <Label htmlFor="require-feedback-questions">
              {m.require_feedback_questions()}
            </Label>
          }
          description={m.require_feedback_questions_description()}
        >
          <Switch
            id="require-feedback-questions"
            checked={settings?.requireFeedbackQuestions ?? true}
            onCheckedChange={handleToggleFeedbackQuestions}
            disabled={updateMutation.isPending}
          />
        </SettingsRow>
      </SettingsPanel>
    </SettingsSection>
  );
}
