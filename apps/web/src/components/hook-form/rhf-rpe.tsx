import { getHighSaturatedRpeColor } from '@/utils/color';
import { cn } from '@/utils/shadcn';
import { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Button } from '../ui/button';
import { Label } from '../ui/label';

type Props = ComponentProps<'input'> & {
  name: string;
  label?: string;
  value?: number;
};

export const RHFRpe = ({ name, label, ...other }: Props) => {
  const { control } = useFormContext();

  // Convert display RPE (1-10) to stored value (0-1)
  const rpeToStoredValue = (rpe: number) => rpe / 10;

  // Convert stored value (0-1) to display RPE (1-10)
  const storedValueToRpe = (value: number | undefined): number | undefined =>
    value === undefined ? undefined : Math.round(value * 10);

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
        render={({ field, fieldState: { error } }) => {
          const selectedRpe = storedValueToRpe(field.value);

          return (
            <div className="flex">
              {[...Array(10)].map((_, index) => {
                const rpeValue = index + 1;
                const isSelected = selectedRpe === rpeValue;

                return (
                  <Button
                    key={rpeValue}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(rpeToStoredValue(rpeValue));
                      }
                    }}
                    className={cn(
                      'flex-1 rounded-none border border-gray-200 text-white dark:border-gray-700 sm:px-3 px-2',
                      index === 0 ? 'rounded-l-md' : '',
                      index === 9 ? 'rounded-r-md' : '',
                      index !== 0 ? 'border-l-0' : '',
                      isSelected
                        ? getHighSaturatedRpeColor(rpeValue / 10, false)
                        : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200',
                      error && 'border-red-500',
                    )}
                  >
                    {rpeValue}
                  </Button>
                );
              })}
            </div>
          );
        }}
      />
    </div>
  );
};
