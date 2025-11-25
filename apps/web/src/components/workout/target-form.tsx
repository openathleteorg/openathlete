import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import { RHFNumberWithUnit } from '@/components/hook-form/rhf-number-with-unit';
import { RHFRpe } from '@/components/hook-form/rhf-rpe';
import { RHFVelocityPace } from '@/components/hook-form/rhf-velocity-pace';
import { RHFZoneSelector } from '@/components/hook-form/rhf-zone-selector';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { WorkoutStepTargetDto } from '@openathlete/shared';
import {
  SPORT_TYPE,
  WORKOUT_TARGET_TYPE,
  getCompatibleMetrics,
} from '@openathlete/shared';

const TARGET_TYPES: { value: WORKOUT_TARGET_TYPE; getLabelFn: () => string }[] =
  [
    {
      value: WORKOUT_TARGET_TYPE.PACE,
      getLabelFn: () => m.target_form_type_pace(),
    },
    {
      value: WORKOUT_TARGET_TYPE.HEARTRATE,
      getLabelFn: () => m.target_form_type_heartrate(),
    },
    {
      value: WORKOUT_TARGET_TYPE.POWER,
      getLabelFn: () => m.target_form_type_power(),
    },
    {
      value: WORKOUT_TARGET_TYPE.CADENCE,
      getLabelFn: () => m.target_form_type_cadence(),
    },
    {
      value: WORKOUT_TARGET_TYPE.WEIGHT,
      getLabelFn: () => m.target_form_type_weight(),
    },
    {
      value: WORKOUT_TARGET_TYPE.ZONE,
      getLabelFn: () => m.target_form_type_zone(),
    },
    {
      value: WORKOUT_TARGET_TYPE.RPE,
      getLabelFn: () => m.target_form_type_rpe(),
    },
  ];

const targetFormSchema = z.object({
  targetType: z.nativeEnum(WORKOUT_TARGET_TYPE),
  targetMin: z.number().nullable().optional(),
  targetMax: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  metricType: z.string().nullable().optional(),
});

type TargetFormValues = z.infer<typeof targetFormSchema>;

/**
 * Adapter component for RPE field that converts between 0-1 (RHFRpe format) and 1-10 (workout format)
 */
function RpeFieldAdapter({
  field,
}: {
  field: ControllerRenderProps<TargetFormValues, 'targetValue'>;
}) {
  // RHFRpe stores 0-1, but workouts store 1-10
  // Create a temporary form context for RHFRpe with conversion
  const rpeValue = field.value ? field.value / 10 : undefined;
  const tempForm = useForm({
    defaultValues: { rpeValue },
  });

  // Sync field.value changes to temp form
  useEffect(() => {
    const newRpeValue = field.value ? field.value / 10 : undefined;
    tempForm.setValue('rpeValue', newRpeValue);
  }, [field.value, tempForm]);

  // Sync temp form changes back to main form
  useEffect(() => {
    const subscription = tempForm.watch((data) => {
      const newRpe = data.rpeValue;
      const workoutValue = newRpe !== undefined ? newRpe * 10 : undefined;
      if (field.value !== workoutValue) {
        field.onChange(workoutValue);
      }
    });
    return () => subscription.unsubscribe();
  }, [tempForm, field]);

  return (
    <FormProvider {...tempForm}>
      <RHFRpe name="rpeValue" label={m.target_form_single_value()} />
    </FormProvider>
  );
}

interface TargetFormProps {
  initialValues?: Partial<WorkoutStepTargetDto>;
  onSubmit: (values: TargetFormValues & { metricType?: string | null }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  sport?: SPORT_TYPE;
}

/**
 * Form for creating or editing a workout step target
 * Supports both range (min/max) and single value targets
 */
export function TargetForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = m.target_form_add(),
  cancelLabel = m.target_form_cancel(),
  sport,
}: TargetFormProps) {
  const { data: athlete } = useGetMyAthleteQuery();
  const { data: latestMetrics = {} } = useGetLatestMetricsQuery(
    athlete?.athleteId,
  );

  const [useRange, setUseRange] = useState(
    !!(initialValues?.targetMin || initialValues?.targetMax),
  );

  // Check if initial values have metricType (meaning values are in 0-1 range)
  const initialMetricType = initialValues?.metricType || null;
  const hasInitialMetric = !!initialMetricType;

  // Convert initial values from percentage (0-1) to display format (0-100) if metricType exists
  const convertFromStoredPercentage = (
    value: number | null | undefined,
    metricType: string | null | undefined,
  ): number | null => {
    if (!value || !metricType) return value ?? null;
    // Value is stored as 0-1, convert to 0-100 for display
    return value * 100;
  };

  // Convert display format (0-100) to stored format (0-1) if metricType exists
  const convertToStoredPercentage = (
    value: number | null | undefined,
    metricType: string | null | undefined,
  ): number | null => {
    if (!value || !metricType) return value ?? null;
    // Convert 0-100 to 0-1 range for storage
    return value / 100;
  };

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      targetType: initialValues?.targetType || WORKOUT_TARGET_TYPE.HEARTRATE,
      targetMin: hasInitialMetric
        ? convertFromStoredPercentage(
            initialValues?.targetMin,
            initialMetricType,
          )
        : initialValues?.targetMin || null,
      targetMax: hasInitialMetric
        ? convertFromStoredPercentage(
            initialValues?.targetMax,
            initialMetricType,
          )
        : initialValues?.targetMax || null,
      targetValue: hasInitialMetric
        ? convertFromStoredPercentage(
            initialValues?.targetValue,
            initialMetricType,
          )
        : initialValues?.targetValue || null,
      metricType: initialMetricType,
    },
  });

  const selectedTargetType = form.watch('targetType');
  const selectedMetricType = form.watch('metricType');

  // Get compatible metrics for the selected target type
  const compatibleMetrics = useMemo(() => {
    return getCompatibleMetrics(selectedTargetType);
  }, [selectedTargetType]);

  // Filter to only show metrics that the athlete has
  const availableMetrics = useMemo(() => {
    return compatibleMetrics.filter(
      (metricType) => latestMetrics[metricType]?.value,
    );
  }, [compatibleMetrics, latestMetrics]);

  // For ZONE type, use targetValue (not range)
  const isZoneType = selectedTargetType === 'ZONE';
  const showRange = useRange && !isZoneType;
  const hasMetric = !!selectedMetricType;

  const handleSubmit = (values: TargetFormValues) => {
    // Convert values from display format (0-100) to stored format (0-1) if metricType is set
    let finalMin = values.targetMin;
    let finalMax = values.targetMax;
    let finalValue = values.targetValue;

    if (values.metricType) {
      finalMin = convertToStoredPercentage(values.targetMin, values.metricType);
      finalMax = convertToStoredPercentage(values.targetMax, values.metricType);
      finalValue = convertToStoredPercentage(
        values.targetValue,
        values.metricType,
      );
    }

    // Clear unused fields based on range toggle and type
    const cleanedValues = {
      ...values,
      targetMin: showRange ? finalMin : null,
      targetMax: showRange ? finalMax : null,
      targetValue: !showRange || isZoneType ? finalValue : null,
      metricType: values.metricType || null,
    };
    onSubmit(cleanedValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-4"
      >
        {/* Target Type */}
        <FormField
          control={form.control}
          name="targetType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.target_form_type()}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={m.target_form_type_placeholder()}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TARGET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.getLabelFn()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {m.target_form_type_description()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Metric Type Selector - only for compatible target types */}
        {availableMetrics.length > 0 && (
          <FormField
            control={form.control}
            name="metricType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{m.target_form_metric_type()}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? null : value);
                  }}
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={m.target_form_metric_type_placeholder()}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      {m.target_form_metric_type_none()}
                    </SelectItem>
                    {availableMetrics.map((metricType) => (
                      <SelectItem key={metricType} value={metricType}>
                        {metricTypeLabelMap[metricType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {m.target_form_metric_type_description()}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Range Toggle - hidden for ZONE */}
        {!isZoneType && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useRange"
              checked={useRange}
              onChange={(e) => setUseRange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="useRange" className="text-sm font-medium">
              {m.target_form_use_range()}
            </label>
          </div>
        )}

        {/* Value Inputs */}
        {isZoneType ? (
          <RHFZoneSelector
            name="targetValue"
            label={m.target_form_single_value()}
            sport={sport}
          />
        ) : selectedTargetType === 'PACE' ? (
          showRange ? (
            <div className="grid grid-cols-1 gap-4">
              {hasMetric ? (
                <RHFNumberWithUnit
                  name="targetMin"
                  label={m.target_form_min_value()}
                  unit={hasMetric ? '%' : m.bpm()}
                  min={0}
                />
              ) : (
                <RHFVelocityPace
                  name="targetMin"
                  label={m.target_form_min_value()}
                />
              )}
              {hasMetric ? (
                <RHFNumberWithUnit
                  name="targetMax"
                  label={m.target_form_max_value()}
                  unit={hasMetric ? '%' : m.bpm()}
                  min={0}
                />
              ) : (
                <RHFVelocityPace
                  name="targetMax"
                  label={m.target_form_max_value()}
                />
              )}
            </div>
          ) : hasMetric ? (
            <RHFNumberWithUnit
              name="targetValue"
              label={m.target_form_single_value()}
              unit={hasMetric ? '%' : m.bpm()}
              min={0}
            />
          ) : (
            <RHFVelocityPace
              name="targetValue"
              label={m.target_form_single_value()}
            />
          )
        ) : selectedTargetType === 'HEARTRATE' ? (
          showRange ? (
            <div className="grid grid-cols-2 gap-4">
              <RHFNumberWithUnit
                name="targetMin"
                label={m.target_form_min_value()}
                unit={hasMetric ? '%' : m.bpm()}
                min={0}
              />
              <RHFNumberWithUnit
                name="targetMax"
                label={m.target_form_max_value()}
                unit={hasMetric ? '%' : m.bpm()}
                min={0}
              />
            </div>
          ) : (
            <RHFNumberWithUnit
              name="targetValue"
              label={m.target_form_single_value()}
              unit={hasMetric ? '%' : m.bpm()}
              min={0}
            />
          )
        ) : selectedTargetType === 'POWER' ? (
          showRange ? (
            <div className="grid grid-cols-2 gap-4">
              <RHFNumberWithUnit
                name="targetMin"
                label={m.target_form_min_value()}
                unit={hasMetric ? '%' : m.watts()}
                min={0}
              />
              <RHFNumberWithUnit
                name="targetMax"
                label={m.target_form_max_value()}
                unit={hasMetric ? '%' : m.watts()}
                min={0}
              />
            </div>
          ) : (
            <RHFNumberWithUnit
              name="targetValue"
              label={m.target_form_single_value()}
              unit={hasMetric ? '%' : m.watts()}
              min={0}
            />
          )
        ) : selectedTargetType === 'CADENCE' ? (
          showRange ? (
            <div className="grid grid-cols-2 gap-4">
              <RHFNumberWithUnit
                name="targetMin"
                label={m.target_form_min_value()}
                unit={m.rpm()}
                min={0}
              />
              <RHFNumberWithUnit
                name="targetMax"
                label={m.target_form_max_value()}
                unit={m.rpm()}
                min={0}
              />
            </div>
          ) : (
            <RHFNumberWithUnit
              name="targetValue"
              label={m.target_form_single_value()}
              unit={m.rpm()}
              min={0}
            />
          )
        ) : selectedTargetType === 'WEIGHT' ? (
          showRange ? (
            <div className="grid grid-cols-2 gap-4">
              <RHFNumberWithUnit
                name="targetMin"
                label={m.target_form_min_value()}
                unit="kg"
                min={0}
              />
              <RHFNumberWithUnit
                name="targetMax"
                label={m.target_form_max_value()}
                unit="kg"
                min={0}
              />
            </div>
          ) : (
            <RHFNumberWithUnit
              name="targetValue"
              label={m.target_form_single_value()}
              unit="kg"
              min={0}
            />
          )
        ) : selectedTargetType === 'RPE' ? (
          showRange ? (
            <div className="text-sm text-muted-foreground">
              {m.target_form_rpe_range_not_supported()}
            </div>
          ) : (
            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => <RpeFieldAdapter field={field} />}
            />
          )
        ) : null}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
