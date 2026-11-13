import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core/sport-type.label-map';
import {
  GOAL_LABELS,
  HOURS_LABELS,
  TEAM_LABELS,
} from '@/views/dashboard/onboarding/onboarding-labels';
import { ChoiceChip } from '@/views/dashboard/onboarding/onboarding-steps';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  COACH_TEAM_SIZES,
  ONBOARDING_SPORTS,
  SPORT_TYPE,
  TRAINING_GOALS,
  TrainingProfileDto,
  WEEKLY_TRAINING_HOURS,
} from '@openathlete/shared';

import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from './settings-section';

// Select needs a value for "nothing chosen": null is not one
const UNSET = 'UNSET';

function ProfileSelect<T extends string>({
  id,
  value,
  options,
  labels,
  disabled,
  onChange,
}: {
  id: string;
  value: T | null | undefined;
  options: readonly T[];
  labels: Record<T, () => string>;
  disabled: boolean;
  onChange: (value: T | null) => void;
}) {
  return (
    <Select
      value={value ?? UNSET}
      disabled={disabled}
      onValueChange={(next) => onChange(next === UNSET ? null : (next as T))}
    >
      <SelectTrigger id={id} className="h-11 w-44 max-w-[50vw]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNSET}>
          {m.settings_training_profile_unset()}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** What the user answered at onboarding, to change later. */
export function TrainingProfileSection() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const updateMutation = useUpdateAccountMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [userKeys.getMe] });
      toast.success(m.settings_training_profile_saved());
    },
    onError: (error) => toast.error(error.message),
  });

  if (!me) return null;
  const isAthlete = me.roles.includes('ATHLETE');
  const isCoach = me.roles.includes('COACH');
  const save = (patch: TrainingProfileDto) => updateMutation.mutate(patch);
  // Prisma's enum and the shared one hold the same strings
  const practiced = me.practicedSports as SPORT_TYPE[];
  const disabled = updateMutation.isPending;
  // Sports picked elsewhere than the onboarding stay on offer
  const sportChoices = [
    ...ONBOARDING_SPORTS,
    ...practiced.filter(
      (sport) => !(ONBOARDING_SPORTS as readonly string[]).includes(sport),
    ),
  ];

  return (
    <SettingsSection
      title={m.settings_training_profile_title()}
      description={m.settings_training_profile_description()}
    >
      <SettingsPanel>
        {isAthlete && (
          <>
            <SettingsRow title={m.settings_training_profile_sports()} stacked>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {sportChoices.map((sport) => {
                  const selected = practiced.includes(sport);
                  return (
                    <ChoiceChip
                      key={sport}
                      label={sportTypeLabelMap[sport]}
                      selected={selected}
                      onToggle={() =>
                        save({
                          practicedSports: selected
                            ? practiced.filter((s) => s !== sport)
                            : [...practiced, sport],
                        })
                      }
                    />
                  );
                })}
              </div>
            </SettingsRow>
            <SettingsRow
              title={
                <label htmlFor="training-goal">
                  {m.settings_training_profile_goal()}
                </label>
              }
            >
              <ProfileSelect
                id="training-goal"
                value={me.trainingGoal}
                options={TRAINING_GOALS}
                labels={GOAL_LABELS}
                disabled={disabled}
                onChange={(trainingGoal) => save({ trainingGoal })}
              />
            </SettingsRow>
            <SettingsRow
              title={
                <label htmlFor="weekly-training-hours">
                  {m.settings_training_profile_hours()}
                </label>
              }
            >
              <ProfileSelect
                id="weekly-training-hours"
                value={me.weeklyTrainingHours}
                options={WEEKLY_TRAINING_HOURS}
                labels={HOURS_LABELS}
                disabled={disabled}
                onChange={(weeklyTrainingHours) =>
                  save({ weeklyTrainingHours })
                }
              />
            </SettingsRow>
          </>
        )}
        {isCoach && (
          <SettingsRow
            title={
              <label htmlFor="coach-team-size">
                {m.settings_training_profile_team()}
              </label>
            }
          >
            <ProfileSelect
              id="coach-team-size"
              value={me.coachTeamSize}
              options={COACH_TEAM_SIZES}
              labels={TEAM_LABELS}
              disabled={disabled}
              onChange={(coachTeamSize) => save({ coachTeamSize })}
            />
          </SettingsRow>
        )}
      </SettingsPanel>
    </SettingsSection>
  );
}
