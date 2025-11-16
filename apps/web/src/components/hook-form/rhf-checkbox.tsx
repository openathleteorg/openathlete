import { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

type Props = Omit<ComponentProps<typeof Checkbox>, 'onCheckedChange'> & {
  name: string;
  label?: string;
  value?: string | number;
};

export const RHFCheckbox = ({ name, label, value, ...other }: Props) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const isArray = Array.isArray(field.value);
        const isChecked = isArray ? field.value?.includes(value) : field.value;

        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${name}-${value}`}
              checked={isChecked}
              onCheckedChange={(checked) => {
                if (isArray) {
                  const newValue = checked
                    ? [...(field.value || []), value]
                    : field.value?.filter((v: unknown) => v !== value);
                  field.onChange(newValue);
                } else {
                  field.onChange(checked);
                }
              }}
              {...other}
            />
            {label && (
              <Label
                htmlFor={`${name}-${value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </Label>
            )}
          </div>
        );
      }}
    />
  );
};
