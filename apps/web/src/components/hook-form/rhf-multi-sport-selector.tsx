import { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { MultiSportSelector } from '../training-zone-editor/multi-sport-selector';
import { Label } from '../ui/label';

type Props = Omit<ComponentProps<typeof MultiSportSelector>, 'value' | 'onChange'> & {
  name: string;
  label?: string;
  required?: boolean;
};

export const RHFMultiSportSelector = ({ name, label, required, ...other }: Props) => {
  const { control } = useFormContext();

  return (
    <div className="grid gap-3">
      {label && (
        <Label htmlFor={name}>
          {label} {required ? '*' : ''}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <MultiSportSelector
              value={field.value || []}
              onChange={(sports) => {
                field.onChange(sports);
              }}
              {...other}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
};

