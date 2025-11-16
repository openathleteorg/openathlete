import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ComponentProps, useEffect, useState } from 'react';
import {
  Controller,
  type ControllerRenderProps,
  type FieldError,
  useFormContext,
} from 'react-hook-form';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type VelocityUnit = 'm_per_s' | 'km_per_h' | 'min_per_km';

type Props = Omit<ComponentProps<'input'>, 'onChange'> & {
  name: string;
  label?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
};

// Convert m/s to km/h
const msToKmh = (ms: number): number => ms * 3.6;

// Convert km/h to m/s
const kmhToMs = (kmh: number): number => kmh / 3.6;

// Convert m/s to min/km (pace)
const msToPace = (ms: number): { minutes: number; seconds: number } => {
  if (ms === 0) return { minutes: 0, seconds: 0 };
  const secondsPerKm = 1000 / ms;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return { minutes, seconds };
};

// Convert min/km (pace) to m/s
const paceToMs = (minutes: number, seconds: number): number => {
  const totalSeconds = minutes * 60 + seconds;
  if (totalSeconds === 0) return 0;
  return 1000 / totalSeconds;
};

/**
 * Adapter component for velocity/pace field that handles unit conversion
 * and manages local state for display values
 */
function VelocityPaceFieldAdapter({
  field,
  error,
  onChange,
  ...other
}: {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  error?: FieldError;
  onChange?: (value: number | undefined) => void;
} & Omit<ComponentProps<'input'>, 'onChange'>) {
  const [unit, setUnit] = useState<VelocityUnit>('km_per_h');
  const [valueInput, setValueInput] = useState<string>('');
  const [paceMinutes, setPaceMinutes] = useState<string>('');
  const [paceSeconds, setPaceSeconds] = useState<string>('');
  const [lastSyncedValue, setLastSyncedValue] = useState<
    number | null | undefined
  >(field.value as number | null | undefined);

  // Initialize from field value (stored in m/s)
  // Only sync when field.value changes externally (not from our own updates)
  useEffect(() => {
    // Skip if value hasn't actually changed or if it's our own update
    if (field.value === lastSyncedValue) return;

    if (field.value === undefined || field.value === null) {
      setValueInput('');
      setPaceMinutes('');
      setPaceSeconds('');
      setLastSyncedValue(field.value);
    } else {
      if (unit === 'min_per_km') {
        const pace = msToPace(field.value as number);
        setPaceMinutes(pace.minutes.toString());
        setPaceSeconds(pace.seconds.toString());
      } else if (unit === 'km_per_h') {
        setValueInput(msToKmh(field.value as number).toString());
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
    if (unit === 'min_per_km') {
      const mins =
        newPaceMinutes === '' ? 0 : parseInt(newPaceMinutes, 10) || 0;
      const secs =
        newPaceSeconds === '' ? 0 : parseInt(newPaceSeconds, 10) || 0;
      if (mins === 0 && secs === 0) {
        field.onChange(undefined);
        onChange?.(undefined);
      } else {
        const valueInMs = paceToMs(mins, secs);
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
        if (!isNaN(numValue)) {
          let valueInMs: number;
          if (unit === 'km_per_h') {
            valueInMs = kmhToMs(numValue);
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
    } else if (unit === 'min_per_km') {
      currentValueMs = field.value as number;
    } else {
      // Try to parse current input, fallback to field value
      const currentInput =
        unit === 'km_per_h'
          ? kmhToMs(parseFloat(valueInput))
          : parseFloat(valueInput);
      currentValueMs = isNaN(currentInput)
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

    if (newUnit === 'min_per_km') {
      const pace = msToPace(currentValueMs);
      setPaceMinutes(pace.minutes.toString());
      setPaceSeconds(pace.seconds.toString());
    } else if (newUnit === 'km_per_h') {
      setValueInput(msToKmh(currentValueMs).toString());
    } else {
      setValueInput(currentValueMs.toString());
    }
  };

  return (
    <div className="flex items-center w-full">
      {unit === 'min_per_km' ? (
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
              <span className="text-md text-gray-500">{m.minutes()}</span>
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
              <span className="text-md text-gray-500">{m.unit_seconds()}</span>
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
          <SelectItem value="min_per_km">{m.per_km()}</SelectItem>
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
            {...other}
          />
        )}
      />
    </div>
  );
};
