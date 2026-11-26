import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ComponentProps, useEffect, useState } from 'react';
import {
  Controller,
  type ControllerRenderProps,
  type FieldError,
  useFormContext,
} from 'react-hook-form';

import { METERS_PER_MILE, MS_TO_MPH } from '@openathlete/shared';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export type VelocityUnit =
  'm_per_s' | 'km_per_h' | 'mph' | 'min_per_km' | 'min_per_mi';

type Props = Omit<ComponentProps<'input'>, 'onChange'> & {
  name: string;
  label?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  /** Unit selected when the field first renders (defaults to km/h or mph) */
  defaultUnit?: VelocityUnit;
};

// Convert m/s to km/h or mph
const msToKmh = (ms: number): number => ms * 3.6;
const kmhToMs = (kmh: number): number => kmh / 3.6;
const msToMph = (ms: number): number => ms * MS_TO_MPH;
const mphToMs = (mph: number): number => mph / MS_TO_MPH;

// Convert m/s to pace (min/km or min/mi)
const msToPace = (
  ms: number,
  distanceMeters: number,
): { minutes: number; seconds: number } => {
  if (ms === 0) return { minutes: 0, seconds: 0 };
  const secondsPerUnit = distanceMeters / ms;
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.round(secondsPerUnit % 60);
  if (seconds === 60) return { minutes: minutes + 1, seconds: 0 };
  return { minutes, seconds };
};

// Convert pace (min/km or min/mi) to m/s
const paceToMs = (
  minutes: number,
  seconds: number,
  distanceMeters: number,
): number => {
  const totalSeconds = minutes * 60 + seconds;
  if (totalSeconds === 0) return 0;
  return distanceMeters / totalSeconds;
};

const isPaceVelocityUnit = (u: VelocityUnit) =>
  u === 'min_per_km' || u === 'min_per_mi';

const paceUnitMeters = (u: VelocityUnit) =>
  u === 'min_per_mi' ? METERS_PER_MILE : 1000;

/**
 * Adapter component for velocity/pace field that handles unit conversion
 * and manages local state for display values
 */
function VelocityPaceFieldAdapter({
  field,
  error,
  onChange,
  defaultUnit = 'km_per_h',
  ...other
}: {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  error?: FieldError;
  onChange?: (value: number | undefined) => void;
  defaultUnit?: VelocityUnit;
} & Omit<ComponentProps<'input'>, 'onChange'>) {
  const units = useUnits();
  const initialUnit: VelocityUnit =
    units.unitSystem === 'IMPERIAL'
      ? defaultUnit === 'km_per_h'
        ? 'mph'
        : defaultUnit === 'min_per_km'
          ? 'min_per_mi'
          : defaultUnit
      : defaultUnit;
  const [unit, setUnit] = useState<VelocityUnit>(initialUnit);
  const [valueInput, setValueInput] = useState<string>('');
  const [paceMinutes, setPaceMinutes] = useState<string>('');
  const [paceSeconds, setPaceSeconds] = useState<string>('');
  const [lastSyncedValue, setLastSyncedValue] = useState<
    number | null | undefined
  >(undefined);

  useEffect(() => {
    if (field.value === lastSyncedValue && lastSyncedValue !== undefined) {
      return;
    }

    if (field.value === undefined || field.value === null) {
      setValueInput('');
      setPaceMinutes('');
      setPaceSeconds('');
      setLastSyncedValue(field.value);
    } else {
      if (isPaceVelocityUnit(unit)) {
        const pace = msToPace(field.value as number, paceUnitMeters(unit));
        setPaceMinutes(pace.minutes.toString());
        setPaceSeconds(pace.seconds.toString());
      } else if (unit === 'km_per_h') {
        setValueInput(msToKmh(field.value as number).toString());
      } else if (unit === 'mph') {
        setValueInput(msToMph(field.value as number).toString());
      } else {
        setValueInput((field.value as number).toString());
      }
      setLastSyncedValue(field.value as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.value, unit]);

  const updateFormValue = (
    newValue: string,
    newPaceMinutes: string = '',
    newPaceSeconds: string = '',
  ) => {
    if (isPaceVelocityUnit(unit)) {
      const mins =
        newPaceMinutes === '' ? 0 : Number.parseInt(newPaceMinutes, 10) || 0;
      const secs =
        newPaceSeconds === '' ? 0 : Number.parseInt(newPaceSeconds, 10) || 0;
      if (mins === 0 && secs === 0) {
        field.onChange(undefined);
        onChange?.(undefined);
      } else {
        const valueInMs = paceToMs(mins, secs, paceUnitMeters(unit));
        setLastSyncedValue(valueInMs);
        field.onChange(valueInMs);
        onChange?.(valueInMs);
      }
    } else {
      if (newValue === '') {
        field.onChange(undefined);
        onChange?.(undefined);
      } else {
        const numValue = parseFloat(newValue);
        if (!Number.isNaN(numValue)) {
          let valueInMs: number;
          if (unit === 'km_per_h') {
            valueInMs = kmhToMs(numValue);
          } else if (unit === 'mph') {
            valueInMs = mphToMs(numValue);
          } else {
            valueInMs = numValue;
          }
          setLastSyncedValue(valueInMs);
          field.onChange(valueInMs);
          onChange?.(valueInMs);
        }
      }
    }
  };

  const handleUnitChange = (newUnit: VelocityUnit) => {
    // Get current value in m/s
    let currentValueMs: number;
    if (field.value === undefined || field.value === null) {
      currentValueMs = 0;
    } else if (isPaceVelocityUnit(unit)) {
      currentValueMs = field.value as number;
    } else {
      const parsed = parseFloat(valueInput);
      const currentInput =
        unit === 'km_per_h'
          ? kmhToMs(parsed)
          : unit === 'mph'
            ? mphToMs(parsed)
            : parsed;
      currentValueMs = Number.isNaN(currentInput)
        ? (field.value as number)
        : currentInput;
    }

    setUnit(newUnit);

    // Convert and display in new unit
    if (currentValueMs === 0 || currentValueMs === undefined) {
      setValueInput('');
      setPaceMinutes('');
      setPaceSeconds('');
      return;
    }

    if (isPaceVelocityUnit(newUnit)) {
      const pace = msToPace(currentValueMs, paceUnitMeters(newUnit));
      setPaceMinutes(pace.minutes.toString());
      setPaceSeconds(pace.seconds.toString());
    } else if (newUnit === 'km_per_h') {
      setValueInput(msToKmh(currentValueMs).toString());
    } else if (newUnit === 'mph') {
      setValueInput(msToMph(currentValueMs).toString());
    } else {
      setValueInput(currentValueMs.toString());
    }
  };

  return (
    <div className="flex items-center w-full">
      {isPaceVelocityUnit(unit) ? (
        <div className="flex items-center flex-1">
          <div className="flex items-center flex-1">
            <Input
              type="number"
              min={0}
              value={paceMinutes}
              onChange={(e) => {
                const newMinutes = e.target.value;
                setPaceMinutes(newMinutes);
                updateFormValue(valueInput, newMinutes, paceSeconds);
              }}
              {...other}
              className={cn(
                other.className,
                'rounded-br-none rounded-tr-none flex-1',
                error && 'border-red-500',
              )}
            />
            <div className="rounded-none border border-l-0 shadow-xs py-1.25 px-3 text-base shrink-0">
              <span className="text-md text-muted-foreground">
                {m.minutes()}
              </span>
            </div>
          </div>
          <div className="flex items-center flex-1">
            <Input
              type="number"
              min={0}
              max={59}
              value={paceSeconds}
              onChange={(e) => {
                const newSeconds = e.target.value;
                setPaceSeconds(newSeconds);
                updateFormValue(valueInput, paceMinutes, newSeconds);
              }}
              {...other}
              className={cn(
                other.className,
                'rounded-none border-l-0 flex-1',
                error && 'border-red-500',
              )}
            />
            <div className="rounded-l-none border border-l-0 shadow-xs py-1.25 px-3 text-base shrink-0 border-r-0">
              <span className="text-md text-muted-foreground">
                {m.unit_seconds()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={valueInput}
          onChange={(e) => {
            const newValue = e.target.value;
            setValueInput(newValue);
            updateFormValue(newValue);
          }}
          {...other}
          className={cn(
            other.className,
            'rounded-r-none border-r-0 flex-1',
            error && 'border-red-500',
          )}
        />
      )}
      <Select value={unit} onValueChange={handleUnitChange}>
        <SelectTrigger className="w-32 rounded-l-none shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="m_per_s">{m.meters_per_second()}</SelectItem>
          <SelectItem value="km_per_h">{m.kilometers_per_hour()}</SelectItem>
          <SelectItem value="mph">{m.miles_per_hour()}</SelectItem>
          <SelectItem value="min_per_km">{m.per_km()}</SelectItem>
          <SelectItem value="min_per_mi">{m.per_mi()}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const RHFVelocityPace = ({
  name,
  type,
  label,
  value,
  onChange,
  defaultUnit,
  ...other
}: Props) => {
  const { control } = useFormContext();

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
        render={({ field, fieldState: { error } }) => (
          <VelocityPaceFieldAdapter
            field={field}
            error={error}
            onChange={onChange}
            defaultUnit={defaultUnit}
            {...other}
          />
        )}
      />
    </div>
  );
};
