import { useUnits } from '@/hooks/use-units';
import { cn } from '@/utils/shadcn';
import { ComponentProps, useEffect, useState } from 'react';
import {
  Controller,
  type ControllerRenderProps,
  type FieldError,
  useFormContext,
} from 'react-hook-form';

import { M_TO_FT } from '@openathlete/shared';

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
  const units = useUnits();
  const factor = units.unitSystem === 'IMPERIAL' ? M_TO_FT : 1;
  const [elevationInput, setElevationInput] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<
    { value: number | null | undefined; factor: number } | undefined
  >(undefined);

  // Set initial value from field (stored in meters)
  useEffect(() => {
    if (
      lastSynced !== undefined &&
      field.value === lastSynced.value &&
      factor === lastSynced.factor
    ) {
      return;
    }

    if (field.value === undefined || field.value === null) {
      setElevationInput('');
      setLastSynced({ value: field.value, factor });
    } else {
      const displayValue = Math.round((field.value as number) * factor);
      setElevationInput(displayValue.toString());
      setLastSynced({ value: field.value as number, factor });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.value, factor]);

  const updateFormValue = (elevation: string) => {
    if (elevation === '') {
      setLastSynced({ value: undefined, factor });
      field.onChange(undefined);
    } else {
      const elevationNum = parseFloat(elevation);
      if (!Number.isNaN(elevationNum)) {
        const meters = elevationNum / factor;
        setLastSynced({ value: meters, factor });
        field.onChange(meters);
      }
    }
  };

  return (
    <div className="flex items-center">
      <Input
        // Labelled by the Label above, which points at the field's name
        id={field.name}
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
        <span className="text-md text-muted-foreground">
          {units.elevationLabel}
        </span>
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
