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

type Props = ComponentProps<'input'> & {
  name: string;
  label?: string;
  value?: number;
};

/**
 * Adapter component for elevation field that manages local state for display value
 */
function ElevationFieldAdapter({
  field,
  error,
  ...other
}: {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  error?: FieldError;
} & ComponentProps<'input'>) {
  const [elevationInput, setElevationInput] = useState<string>('');

  // Set initial value from field
  useEffect(() => {
    if (field.value === undefined || field.value === null) {
      setElevationInput('');
    } else {
      setElevationInput((field.value as number).toString());
    }
  }, [field.value]);

  const updateFormValue = (elevation: string) => {
    if (elevation === '') {
      field.onChange(undefined);
    } else {
      const elevationNum = parseFloat(elevation);
      field.onChange(elevationNum);
    }
  };

  return (
    <div className="flex items-center">
      <Input
        type="number"
        min={0}
        step="any"
        value={elevationInput}
        onChange={(event) => {
          const newElevationInput = event.target.value;
          setElevationInput(newElevationInput);
          updateFormValue(newElevationInput);
        }}
        {...other}
        className={cn(
          other.className,
          'rounded-r-none border-r-0',
          error && 'border-red-500',
        )}
      />
      <div className="rounded-l-none rounded-r-md border border-l-0 shadow-xs py-1.25 px-3 text-base">
        <span className="text-md text-gray-500">{m.meters()}</span>
      </div>
    </div>
  );
}

export const RHFElevation = ({
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
          <ElevationFieldAdapter field={field} error={error} {...other} />
        )}
      />
    </div>
  );
};
