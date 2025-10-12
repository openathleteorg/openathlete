import { cn } from '@/utils/shadcn';
import { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '../ui/input';
import { Label } from '../ui/label';

type Props = ComponentProps<'input'> & {
  name: string;
  label?: string;
};

export const RHFTextField = ({ name, type, label, ...other }: Props) => {
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
          <Input
            {...field}
            type={type}
            value={
              type === 'number'
                ? field.value === undefined ||
                  field.value === null ||
                  field.value === ''
                  ? ''
                  : field.value
                : field.value === undefined || field.value === null
                  ? ''
                  : field.value
            }
            onChange={(event) => {
              const value = event.target.value;
              let inserted;

              if (type === 'number') {
                if (value === '' || value === null || value === undefined) {
                  inserted = '';
                } else {
                  const numValue = Number(value);
                  inserted = isNaN(numValue) ? '' : numValue;
                }
              } else {
                inserted = value;
              }

              field.onChange(inserted);
            }}
            {...other}
            className={cn(other.className, error && 'border-red-500')}
          />
        )}
      />
    </div>
  );
};
