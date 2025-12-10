import { SportIcon } from '@/components/sport-icon/sport-icon';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { UseFormSetValue } from 'react-hook-form';

import { EVENT_TYPE, SPORT_TYPE, formatSpeed } from '@openathlete/shared';

import {
  RHFDatePicker,
  RHFDistance,
  RHFDuration,
  RHFSelect,
  RHFTextField,
} from '../../hook-form';
import { RHFElevation } from '../../hook-form/rhf-elevation';
import { RHFRpe } from '../../hook-form/rhf-rpe';
import { RHFTextarea } from '../../hook-form/rhf-textarea';
import { SelectItem } from '../../ui/select';
import type { EventFormValues } from '../utils/event-form-schemas';

type Props = {
  type: EVENT_TYPE;
  hasStepsWithDuration: boolean;
  startDateValue?: Date;
  goalDistanceValue?: number | null;
  goalDurationValue?: number | null;
  setValue: UseFormSetValue<EventFormValues>;
  isTemplate?: boolean;
};

export function EventFormFields({
  type,
  hasStepsWithDuration,
  startDateValue,
  goalDistanceValue,
  goalDurationValue,
  setValue,
  isTemplate,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <RHFTextField
        name="name"
        type="text"
        placeholder={m.morning_run()}
        label={m.event_name()}
        required
      />
      {type === EVENT_TYPE.TRAINING ||
      type === EVENT_TYPE.COMPETITION ||
      type === EVENT_TYPE.ACTIVITY ? (
        <RHFSelect
          name="sport"
          label={m.sport()}
          required
          placeholder={m.select_a_sport()}
        >
          {Object.values(SPORT_TYPE).map((sport) => (
            <SelectItem key={sport} value={sport}>
              <SportIcon sport={sport} /> {sportTypeLabelMap[sport]}
            </SelectItem>
          ))}
        </RHFSelect>
      ) : (
        <div className="hidden md:block" />
      )}
      {!isTemplate &&
        (type === EVENT_TYPE.TRAINING || type === EVENT_TYPE.COMPETITION) && (
          <div className="col-span-1 md:col-span-2">
            <RHFDatePicker
              name="startDate"
              label={m.start_date()}
              onChange={(date) => {
                if (date && !hasStepsWithDuration) {
                  const duration = goalDurationValue || 3600; // 1 hour default
                  const end = new Date(date);
                  end.setSeconds(end.getSeconds() + duration);
                  setValue('endDate', end);
                }
              }}
            />
          </div>
        )}
      <div className="col-span-1 md:col-span-2">
        <RHFTextarea
          name="description"
          label={m.description()}
          className="h-24"
          required={type === EVENT_TYPE.NOTE}
        />
      </div>
      {(type === EVENT_TYPE.TRAINING || type === EVENT_TYPE.COMPETITION) && (
        <>
          <RHFDistance name="goalDistance" label={m.goal_distance()} />
          <RHFDuration
            name="goalDuration"
            label={m.goal_duration()}
            disabled={hasStepsWithDuration}
            onChange={(value) => {
              if (!hasStepsWithDuration && startDateValue) {
                const start = new Date(startDateValue);
                const duration = value || 3600; // Default 1 hour
                const end = new Date(start);
                end.setSeconds(start.getSeconds() + duration);
                setValue('endDate', end);
              }
            }}
          />
          {!!goalDistanceValue && !!goalDurationValue && (
            <div className="text-xs md:text-sm text-gray-500 flex flex-col md:flex-row md:items-center gap-1 md:gap-0 col-span-1 md:col-span-2">
              <span>
                {m.pace()}:{' '}
                {formatSpeed(
                  Number(goalDistanceValue) / Number(goalDurationValue),
                  'min/km',
                )}{' '}
                {m.per_km()}
              </span>
              <span className="hidden md:inline"> - </span>
              <span>
                {formatSpeed(
                  Number(goalDistanceValue) / Number(goalDurationValue),
                  'km/h',
                )}{' '}
                {m.kilometers_per_hour()}
              </span>
            </div>
          )}
          <RHFElevation
            name="goalElevationGain"
            label={m.goal_elevation_gain()}
          />
          <RHFRpe name="goalRpe" label={m.goal_rpe()} />
        </>
      )}
      {type === EVENT_TYPE.ACTIVITY && (
        <div className="col-span-1 md:col-span-2">
          <RHFRpe name="rpe" label={m.rpe()} />
        </div>
      )}
    </div>
  );
}
