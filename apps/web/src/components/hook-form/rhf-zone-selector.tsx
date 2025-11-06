import { useTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ComponentProps } from 'react';
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
};

// Determine zone type based on sport
const getZoneTypeForSport = (
  _sport?: keyof typeof SPORT_TYPE,
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
  ...other
}: Props) => {
  const { control } = useFormContext();
  const actualZoneType =
    zoneType ||
    (sport ? getZoneTypeForSport(sport) : TRAINING_ZONE_TYPE.HEARTRATE);
  const sportValue = sport ? SPORT_TYPE[sport] : undefined;
  const zones = useTrainingZones(actualZoneType, sportValue);

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
                const numValue = value === '' ? undefined : parseInt(value, 10);
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
                {zones?.map((zone, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
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
