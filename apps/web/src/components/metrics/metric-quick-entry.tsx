import { AthleteMetric, useCreateMetricMutation } from '@/api/metric';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getMetricUnit } from '@/utils/metric-unit';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { METRIC_TYPE, createMetricDtoSchema } from '@openathlete/shared';

import { FormProvider, RHFDatePicker, RHFTextField } from '../hook-form';
import { formatMetricValue, toMetricDay } from './metric-stats';
import { metricCategories, useMetricDateLabel } from './metric-utils';

/** Measured by hand: a watch fills the rest */
const MANUAL_METRICS = [
  METRIC_TYPE.WEIGHT,
  METRIC_TYPE.HR_REST,
  METRIC_TYPE.VMA,
  METRIC_TYPE.FTP_CYCLING,
];

const positiveOrEmpty = z
  .string()
  .optional()
  .refine(
    (value) =>
      !value?.trim() ||
      createMetricDtoSchema.shape.value.safeParse(value.replace(',', '.'))
        .success,
    { message: m.metrics_value_positive() },
  );

const quickEntrySchema = z.object({
  date: createMetricDtoSchema.shape.date,
  values: z.record(z.string(), positiveOrEmpty),
});
type QuickEntry = z.infer<typeof quickEntrySchema>;

interface P {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latest: Record<string, AthleteMetric>;
  athleteId?: number;
}

export function MetricQuickEntry({ open, onOpenChange, latest, athleteId }: P) {
  const dateLabel = useMetricDateLabel();
  const [types, setTypes] = useState(MANUAL_METRICS);
  const createMetric = useCreateMetricMutation();
  const methods = useForm<QuickEntry>({
    resolver: zodResolver(quickEntrySchema),
    defaultValues: { date: new Date(), values: {} },
  });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (open) {
      reset({ date: new Date(), values: {} });
      setTypes(MANUAL_METRICS);
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async ({ date, values }) => {
    const entries = types.flatMap((type) => {
      const value = values[type]?.trim().replace(',', '.');
      return value ? [{ type, value: Number(value), date }] : [];
    });
    if (!entries.length) {
      toast.error(m.metrics_quick_nothing());
      return;
    }
    const results = await Promise.allSettled(
      entries.map((body) => createMetric.mutateAsync({ body, athleteId })),
    );
    if (results.some((result) => result.status === 'rejected')) {
      toast.error(m.metrics_save_failed());
      return;
    }
    toast.success(m.metrics_quick_saved({ count: entries.length }));
    onOpenChange(false);
  });

  const lastValue = (type: METRIC_TYPE) => {
    const metric = latest[type];
    if (!metric) return m.metrics_no_value_yet();
    return m.metrics_quick_last_value({
      value: formatMetricValue(type, metric.value),
      date: dateLabel(toMetricDay(metric.date)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.metrics_enter_values()}</DialogTitle>
          <DialogDescription>{m.metrics_quick_intro()}</DialogDescription>
        </DialogHeader>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="flex flex-col gap-3">
            <RHFDatePicker
              name="date"
              label={m.date()}
              required
              max={new Date()}
            />
            {types.map((type) => (
              <div key={type} className="flex flex-col gap-1">
                <RHFTextField
                  name={`values.${type}`}
                  label={`${metricTypeLabelMap[type]} (${getMetricUnit(type)})`}
                  inputMode="decimal"
                />
                <span className="text-xs text-muted-foreground">
                  {lastValue(type)}
                </span>
              </div>
            ))}
            <Select
              value=""
              onValueChange={(value) =>
                setTypes((current) => [...current, value as METRIC_TYPE])
              }
            >
              <SelectTrigger aria-label={m.metrics_quick_add_other()}>
                <SelectValue placeholder={m.metrics_quick_add_other()} />
              </SelectTrigger>
              <SelectContent>
                {metricCategories().map(({ key, label, types: inCategory }) => (
                  <div key={key}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {label}
                    </div>
                    {inCategory
                      .filter((type) => !types.includes(type))
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {metricTypeLabelMap[type]}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="w-full"
              isLoading={createMetric.isPending}
            >
              {m.save()}
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
