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

type Props = Omit<ComponentProps<'input'>, 'onChange'> & {
  name: string;
  label?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  unit: string;
  min?: number;
  max?: number;
};

/**
 * Adapter component for number with unit field that manages local state for display value
 */
function NumberWithUnitFieldAdapter({
  field,
  error,
  onChange,
  unit,
  min,
  max,
  ...other
}: {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  error?: FieldError;
  onChange?: (value: number | undefined) => void;
  unit: string;
  min?: number;
  max?: number;
} & Omit<ComponentProps<'input'>, 'onChange'>) {
  const [numberInput, setNumberInput] = useState<string>(
    field.value !== undefined && field.value !== null
      ? (field.value as number).toString()
      : '',
  );

  useEffect(() => {
    if (field.value === undefined || field.value === null) {
      setNumberInput('');
    } else {
      setNumberInput((field.value as number).toString());
    }
  }, [field.value]);

  const updateFormValue = (number: string) => {
    if (number === '') {
      field.onChange(undefined);
      onChange?.(undefined);
    } else {
      const numberValue = parseFloat(number);
      if (!isNaN(numberValue)) {
        field.onChange(numberValue);
        onChange?.(numberValue);
      }
    }
  };

  return (
    <div className="flex items-center w-full">
      <Input
        type="number"
        min={min}
        max={max}
        step="any"
        value={numberInput}
        onChange={(event) => {
          const newNumberInput = event.target.value;
          setNumberInput(newNumberInput);
          updateFormValue(newNumberInput);
        }}
        {...other}
        className={cn(
          other.className,
          'rounded-r-none border-r-0 flex-1',
          error && 'border-red-500',
        )}
      />
      <div className="rounded-l-none rounded-r-md border border-l-0 shadow-xs py-1.25 px-3 text-base shrink-0">
        <span className="text-md text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

export const RHFNumberWithUnit = ({
  name,
  type,
  label,
  value,
  onChange,
  unit,
  min,
  max,
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
          <NumberWithUnitFieldAdapter
            field={field}
            error={error}
            onChange={onChange}
            unit={unit}
            min={min}
            max={max}
            {...other}
          />
        )}
      />
    </div>
  );
};
