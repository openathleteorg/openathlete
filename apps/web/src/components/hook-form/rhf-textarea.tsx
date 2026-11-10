import { cn } from '@/utils/shadcn';
import { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Textarea } from '../ui/input';
import { Label } from '../ui/label';

type Props = ComponentProps<'textarea'> & {
  name: string;
  label?: string;
};

export const RHFTextarea = ({ name, label, ...other }: Props) => {
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
          <Textarea
            {...field}
            // Ties the field to its label for screen readers
            id={name}
            value={
              field.value === undefined || field.value === null
                ? ''
                : field.value
            }
            onChange={(event) => {
              const value = event.target.value;
              field.onChange(value);
            }}
            {...other}
            className={cn(other.className, error && 'border-red-500')}
          />
        )}
      />
    </div>
  );
};
