import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { Controller, useForm } from 'react-hook-form';

import { SPORT_TYPE } from '@openathlete/shared';

import { FormProvider, RHFTextField } from '../hook-form';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

const ALL_SPORTS = Object.values(SPORT_TYPE);

export interface TrainingZoneFormValues {
  name: string;
  description?: string;
  min: number;
  max: number;
  color: string;
  sports: SPORT_TYPE[];
}

export function TrainingZoneForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<TrainingZoneFormValues>;
  onSubmit: (values: TrainingZoneFormValues) => void;
  isLoading?: boolean;
}) {
  const methods = useForm<TrainingZoneFormValues>({
    defaultValues: {
      name: '',
      description: '',
      min: 0,
      max: 0,
      color: '#cccccc',
      sports: defaultValues?.sports ?? ALL_SPORTS,
      ...defaultValues,
    },
  });

  return (
    <FormProvider
      methods={methods}
      onSubmit={methods.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <RHFTextField name="name" label={m.name()} required />
      <RHFTextField name="description" label={m.description()} />
      <div className="flex gap-2">
        <RHFTextField name="min" label={m.min()} type="number" required />
        <RHFTextField name="max" label={m.max()} type="number" required />
      </div>
      <RHFTextField
        name="color"
        label={m.color()}
        type="color"
        required
        className="w-16 h-10 p-0 border-none radi"
      />
      <Controller
        name="sports"
        control={methods.control}
        render={({ field }) => (
          <div>
            <Label>{m.sports()} </Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_SPORTS.map((sport) => (
                <label key={sport} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    value={sport}
                    checked={field.value?.includes(sport)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        field.onChange([...(field.value || []), sport]);
                      } else {
                        field.onChange(
                          (field.value || []).filter((s) => s !== sport),
                        );
                      }
                    }}
                  />
                  {sportTypeLabelMap[sport]}
                </label>
              ))}
            </div>
          </div>
        )}
      />
      <Button type="submit" className="w-full" isLoading={isLoading}>
        {m.save()}{' '}
      </Button>
    </FormProvider>
  );
}
