import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ComponentProps, useEffect, useState } from 'react';
import {
  Controller,
  type ControllerRenderProps,
  type FieldError,
  useFormContext,
} from 'react-hook-form';

import { DistanceUnit } from '@openathlete/shared';

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
  mi: 1609.34,
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
  const [distanceInput, setDistanceInput] = useState<string>('');
  const [unit, setUnit] = useState<DistanceUnit>('km');

  // Convert stored value (in meters) to display value in selected unit
  useEffect(() => {
    if (field.value === undefined || field.value === null) {
      setDistanceInput('');
    } else {
      // Convert from meters to current unit
      const convertedValue = (field.value as number) / UNIT_CONVERSION[unit];
      setDistanceInput(convertedValue.toString());
    }
  }, [field.value, unit]);

  const updateFormValue = (distance: string) => {
    if (distance === '') {
      field.onChange(undefined);
    } else {
      // Store the value in meters (base unit)
      const distanceNum = parseFloat(distance);
      field.onChange(distanceNum * UNIT_CONVERSION[unit]);
    }
  };

  // Handle unit change with conversion
  const handleUnitChange = (newUnit: DistanceUnit) => {
    if (distanceInput !== '') {
      // Convert current value to meters
      const valueInMeters = parseFloat(distanceInput) * UNIT_CONVERSION[unit];
      // Then convert to new unit
      const convertedValue = valueInMeters / UNIT_CONVERSION[newUnit];
      setDistanceInput(convertedValue.toFixed(2));
    }
    setUnit(newUnit);
  };

  return (
    <div className="flex items-center">
      <Input
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
