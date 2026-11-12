import { SportIcon } from '@/components/sport-icon/sport-icon';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core/sport-type.label-map';
import { cn } from '@/utils/shadcn';
import { ChevronDown, Target } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { SPORT_TYPE } from '@openathlete/shared';

import { formatCompactDuration } from '../../calendar/utils/week-summary';
import { RHFDistance, RHFDuration } from '../../hook-form';
import { RHFDateTimePicker } from '../../hook-form/rhf-datetime-picker';
import { RHFElevation } from '../../hook-form/rhf-elevation';
import { RHFRpe } from '../../hook-form/rhf-rpe';
import { RHFTextarea } from '../../hook-form/rhf-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '../../ui/select';
import type { EventFormValues } from '../utils/event-form-schemas';

/** The sports most sessions are planned in, one tap away */
const MAIN_SPORTS = [
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.SWIMMING,
  SPORT_TYPE.STRENGTH,
];

/** The session name, large, filled from the workout until it is typed */
export function SessionTitleField({ suggestion }: { suggestion: string }) {
  const { control } = useFormContext<EventFormValues>();
  return (
    <Controller
      name="name"
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <input
            {...field}
            value={field.value ?? ''}
            placeholder={suggestion || m.composer_name_placeholder()}
            aria-label={m.event_name()}
            aria-invalid={!!error}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
            className="w-full truncate rounded-md bg-transparent py-1 text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/30 md:text-3xl"
            data-session-name
          />
          {error && (
            <p className="mt-1 text-sm text-destructive">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}

export function SportChips() {
  const { control } = useFormContext<EventFormValues>();
  return (
    <Controller
      name="sport"
      control={control}
      render={({ field }) => {
        const other = field.value && !MAIN_SPORTS.includes(field.value);
        return (
          <div
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
            role="radiogroup"
            aria-label={m.sport()}
          >
            {MAIN_SPORTS.map((sport) => (
              <button
                key={sport}
                type="button"
                role="radio"
                aria-checked={field.value === sport}
                onClick={() => field.onChange(sport)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
                  field.value === sport
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-accent',
                )}
                data-sport-chip={sport}
              >
                <SportIcon
                  sport={sport}
                  decorative
                  className={cn(
                    'size-4',
                    field.value === sport && 'invert dark:invert-0',
                  )}
                />
                {sportTypeLabelMap[sport]}
              </button>
            ))}
            <Select
              value={other ? field.value : ''}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                className={cn(
                  'h-9 w-auto shrink-0 rounded-full px-3',
                  other && 'border-primary bg-primary text-primary-foreground',
                )}
                aria-label={m.composer_other_sport()}
              >
                <span className="flex items-center gap-1.5">
                  {other ? (
                    <>
                      <SportIcon
                        sport={field.value}
                        className="size-4 invert dark:invert-0"
                      />
                      {sportTypeLabelMap[field.value]}
                    </>
                  ) : (
                    m.composer_other_sport()
                  )}
                </span>
              </SelectTrigger>
              <SelectContent>
                {Object.values(SPORT_TYPE)
                  .filter((sport) => !MAIN_SPORTS.includes(sport))
                  .sort((a, b) =>
                    sportTypeLabelMap[a].localeCompare(sportTypeLabelMap[b]),
                  )
                  .map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      <SportIcon sport={sport} /> {sportTypeLabelMap[sport]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );
      }}
    />
  );
}

interface TrainingDetailsProps {
  isTemplate?: boolean;
  workoutDuration?: number | null;
  durationSetByHand?: boolean;
  onDurationEdited?: () => void;
  onFollowWorkout?: () => void;
  /** Goals are worth opening when they say more than the workout */
  hasGoals: boolean;
}

/** When, what for, and the goals the workout does not already give */
export function TrainingDetails({
  isTemplate,
  workoutDuration,
  durationSetByHand,
  onDurationEdited,
  onFollowWorkout,
  hasGoals,
}: TrainingDetailsProps) {
  const [goalsOpen, setGoalsOpen] = useState(hasGoals);
  return (
    <div className="space-y-4">
      {!isTemplate && (
        <RHFDateTimePicker name="startDate" label={m.composer_when()} />
      )}
      <RHFTextarea
        name="description"
        label={m.composer_description()}
        placeholder={m.composer_description_placeholder()}
        className="h-24"
      />
      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setGoalsOpen((open) => !open)}
          aria-expanded={goalsOpen}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium"
        >
          <Target className="size-4 text-muted-foreground" />
          {m.composer_goals()}
          <ChevronDown
            className={cn(
              'ml-auto size-4 text-muted-foreground transition-transform',
              goalsOpen && 'rotate-180',
            )}
          />
        </button>
        {goalsOpen && (
          <div className="space-y-4 border-t p-3">
            <div className="space-y-1">
              <RHFDuration
                name="goalDuration"
                label={m.goal_duration()}
                onChange={() => onDurationEdited?.()}
              />
              {typeof workoutDuration === 'number' &&
                (durationSetByHand ? (
                  <button
                    type="button"
                    className="text-left text-xs text-primary underline-offset-4 hover:underline"
                    onClick={onFollowWorkout}
                  >
                    {m.goal_duration_use_workout_total({
                      duration: formatCompactDuration(workoutDuration),
                    })}
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {m.goal_duration_follows_workout()}
                  </p>
                ))}
            </div>
            <RHFDistance name="goalDistance" label={m.goal_distance()} />
            <RHFElevation
              name="goalElevationGain"
              label={m.goal_elevation_gain()}
            />
            <RHFRpe name="goalRpe" label={m.goal_rpe()} compact />
          </div>
        )}
      </div>
    </div>
  );
}
