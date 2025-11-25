import { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { DatePicker } from '../ui/date-picker';
import { Label } from '../ui/label';

type Props = Omit<ComponentProps<'input'>, 'onChange' | 'max' | 'min'> & {
  name: string;
  label?: string;
  onChange?: (value: Date | undefined) => void;
  max?: Date;
  min?: Date;
};

export function RHFDatePicker({ name, label, max, min, ...other }: Props) {
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
          <>
            <DatePicker
              {...other}
              date={field.value ? new Date(field.value) : undefined}
              onDateChange={(date) => {
                if (date) {
                  const normalized = new Date(date);
                  normalized.setHours(12, 0, 0, 0);
                  field.onChange(normalized.toISOString());
                  other.onChange?.(normalized);
                } else {
                  field.onChange(date);
                  other.onChange?.(date);
                }
              }}
              className={error ? 'border-red-500' : ''}
              max={max}
              min={min}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}
