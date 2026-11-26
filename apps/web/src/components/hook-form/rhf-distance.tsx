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

import {
  DistanceUnit,
  METERS_PER_MILE,
  METERS_PER_YARD,
} from '@openathlete/shared';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type Props = ComponentProps<'input'> & {
  name: string;
  label?: string;
  value?: number;
};

const UNIT_CONVERSION = {
  m: 1,
  km: 1000,
  mi: METERS_PER_MILE,
  yd: METERS_PER_YARD,
};

/**
 * Adapter component for distance field that handles unit conversion
 * and manages local state for display values
 */
function DistanceFieldAdapter({
  field,
  error,
  ...other
}: {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  error?: FieldError;
} & ComponentProps<'input'>) {
  const units = useUnits();
  const [distanceInput, setDistanceInput] = useState<string>('');
  const [unit, setUnit] = useState<DistanceUnit>(units.distanceUnit);
  const [userPickedUnit, setUserPickedUnit] = useState(false);
  const [lastSynced, setLastSynced] = useState<
    { value: number | null | undefined; unit: DistanceUnit } | undefined
  >(undefined);

  useEffect(() => {
    if (!userPickedUnit) {
      setUnit(units.distanceUnit);
    }
  }, [units.distanceUnit, userPickedUnit]);

  // Convert stored value (in meters) to display value in selected unit
  useEffect(() => {
    if (
      lastSynced !== undefined &&
      field.value === lastSynced.value &&
      unit === lastSynced.unit
    ) {
      return;
    }

    if (field.value === undefined || field.value === null) {
      setDistanceInput('');
      setLastSynced({ value: field.value, unit });
    } else {
      // Convert from meters to current unit
      const convertedValue = (field.value as number) / UNIT_CONVERSION[unit];
      setDistanceInput(Number(convertedValue.toFixed(4)).toString());
      setLastSynced({ value: field.value as number, unit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.value, unit]);

  const updateFormValue = (distance: string) => {
    if (distance === '') {
      setLastSynced({ value: undefined, unit });
      field.onChange(undefined);
    } else {
      // Store the value in meters (base unit)
      const distanceNum = parseFloat(distance);
      if (!Number.isNaN(distanceNum)) {
        const meters = distanceNum * UNIT_CONVERSION[unit];
        setLastSynced({ value: meters, unit });
        field.onChange(meters);
      }
    }
  };

  // Handle unit change with conversion
  const handleUnitChange = (newUnit: DistanceUnit) => {
    setUserPickedUnit(true);
    if (distanceInput !== '') {
      const distanceNum = parseFloat(distanceInput);
      if (!Number.isNaN(distanceNum)) {
        const valueInMeters = distanceNum * UNIT_CONVERSION[unit];
        const convertedValue = valueInMeters / UNIT_CONVERSION[newUnit];
        setDistanceInput(Number(convertedValue.toFixed(2)).toString());
        setLastSynced({
          value: field.value as number | null | undefined,
          unit: newUnit,
        });
      }
    }
    setUnit(newUnit);
  };

  return (
    <div className="flex items-center">
      <Input
        // Labelled by the Label above, which points at the field's name
        id={field.name}
        type="number"
        min={0}
        step="any"
        value={distanceInput}
        onChange={(event) => {
          const newDistanceInput = event.target.value;
          setDistanceInput(newDistanceInput);
          updateFormValue(newDistanceInput);
        }}
        {...other}
        className={cn(
          other.className,
          'rounded-r-none border-r-0',
          error && 'border-red-500',
        )}
      />
      <Select value={unit} onValueChange={handleUnitChange}>
        <SelectTrigger className="w-24 rounded-l-none">
          <SelectValue placeholder={m.unit()} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="m">{m.meters()}</SelectItem>
          <SelectItem value="yd">{m.yards()}</SelectItem>
          <SelectItem value="km">{m.kilometers()}</SelectItem>
          <SelectItem value="mi">{m.miles()}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const RHFDistance = ({
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
          <DistanceFieldAdapter field={field} error={error} {...other} />
        )}
      />
    </div>
  );
};
