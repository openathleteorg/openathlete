import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { EVENT_TYPE, SPORT_TYPE, formatSpeed } from '@openathlete/shared';

import {
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
  startDateValue: Date;
  goalDistanceValue?: number | null;
  goalDurationValue?: number | null;
  watch: UseFormWatch<EventFormValues>;
  setValue: UseFormSetValue<EventFormValues>;
};

export function EventFormFields({
  type,
  hasStepsWithDuration,
  startDateValue,
  goalDistanceValue,
  goalDurationValue,
  setValue,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
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
              {sportTypeLabelMap[sport]}
            </SelectItem>
          ))}
        </RHFSelect>
      ) : (
        <div />
      )}
      <div className="col-span-2">
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
              if (!hasStepsWithDuration) {
                const start = new Date(startDateValue);
                const duration = value || 0;
                const end = new Date(start);
                end.setSeconds(start.getSeconds() + duration);
                setValue('endDate', end);
              }
            }}
          />
          {!!goalDistanceValue && !!goalDurationValue && (
            <div className="text-sm text-gray-500 flex items-center col-span-2">
              {m.pace()}:{' '}
              {formatSpeed(
                Number(goalDistanceValue) / Number(goalDurationValue),
                'min/km',
              )}{' '}
              {m.per_km()} -{' '}
              {formatSpeed(
                Number(goalDistanceValue) / Number(goalDurationValue),
                'km/h',
              )}{' '}
              {m.kilometers_per_hour()}
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
        <div className="col-span-2">
          <RHFRpe name="rpe" label={m.rpe()} />
        </div>
      )}
    </div>
  );
}
