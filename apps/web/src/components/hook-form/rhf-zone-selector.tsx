import { useWorkoutAthleteId } from '@/components/workout/workout-athlete-context';
import { useAthleteTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { zoneOptions } from '@/utils/training-zone-options';
import { ComponentProps, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type Props = Omit<ComponentProps<'input'>, 'onChange'> & {
  name: string;
  label?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  sport?: keyof typeof SPORT_TYPE;
  zoneType?: TRAINING_ZONE_TYPE;
  /** The athlete whose zones to offer; default: the workout's athlete */
  athleteId?: number | null;
};

// Determine zone type based on sport
const getZoneTypeForSport = (
  _?: keyof typeof SPORT_TYPE,
): TRAINING_ZONE_TYPE => {
  // if (_sport === 'CYCLING') {
  //   return TRAINING_ZONE_TYPE.POWER;
  // }
  // if (_sport === 'RUNNING' || _sport === 'TRAIL_RUNNING') {
  //   return TRAINING_ZONE_TYPE.PACE;
  // }
  // // Default to heart rate for other sports
  return TRAINING_ZONE_TYPE.HEARTRATE;
};

export const RHFZoneSelector = ({
  name,
  label,
  value,
  onChange,
  sport,
  zoneType,
  athleteId,
  ...other
}: Props) => {
  const { control } = useFormContext();
  const workoutAthleteId = useWorkoutAthleteId();
  const actualZoneType =
    zoneType ||
    (sport ? getZoneTypeForSport(sport) : TRAINING_ZONE_TYPE.HEARTRATE);
  const sportValue = sport ? SPORT_TYPE[sport] : undefined;
  // The session athlete's own zones only: the target stores the zone id, and
  // default zones (negative ids) belong to nobody
  const { zones: athleteZones, isLoading } = useAthleteTrainingZones(
    athleteId === undefined ? workoutAthleteId : athleteId,
  );
  const zones = useMemo(
    () => zoneOptions(athleteZones, actualZoneType, sportValue),
    [athleteZones, actualZoneType, sportValue],
  );

  if (!isLoading && zones.length === 0) {
    return (
      <div className="grid gap-3">
        {label && <Label>{label}</Label>}
        <p className="text-sm text-muted-foreground">
          {m.target_form_no_training_zones()}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {label && (
        <Label htmlFor={name}>
          {label} {other.required ? '*' : ''}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          return (
            <Select
              value={field.value?.toString() ?? ''}
              onValueChange={(value) => {
                const numValue =
                  value === '' ? undefined : Number.parseInt(value, 10);
                field.onChange(numValue);
                onChange?.(numValue);
              }}
            >
              <SelectTrigger className={cn(error && 'border-red-500')}>
                <SelectValue
                  placeholder={m.target_form_training_zone_placeholder()}
                />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    <div className="flex items-center gap-2">
                      {zone.color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: zone.color,
                          }}
                        />
                      )}
                      <span>{zone.name}</span>
                      {zone.description && (
                        <span className="text-sm text-muted-foreground">
                          ({zone.description})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />
    </div>
  );
};
