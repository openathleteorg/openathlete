import { m } from '@/paraglide/messages';
import { AthleteMetric, MetricAPI } from '@/api/metric';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  CreateMetricDto,
  METRIC_TYPE,
  createMetricDtoSchema,
  metricCalculationMap,
  metricUnitMap,
  metricsByCategory,
} from '@openathlete/shared';

import {
  FormProvider,
  RHFDatePicker,
  RHFSelect,
  RHFTextField,
  RHFTextarea,
} from '../hook-form';
import { Button } from '../ui/button';
import { SelectItem } from '../ui/select';

interface MetricFormProps {
  onSubmit: (values: CreateMetricDto) => void;
  defaultValues?: Partial<AthleteMetric>;
  className?: string;
  hideTypeSelector?: boolean;
}

export function MetricForm({
  onSubmit,
  defaultValues,
  className,
  hideTypeSelector = false,
}: MetricFormProps) {
  const methods = useForm<CreateMetricDto>({
    resolver: zodResolver(createMetricDtoSchema),
    defaultValues: {
      type: defaultValues?.type || METRIC_TYPE.WEIGHT,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      value: defaultValues?.value ?? undefined,
      notes: defaultValues?.notes || '',
    },
  });

  const { handleSubmit, watch, setValue } = methods;
  const selectedType = watch('type');
  const [isCalculating, setIsCalculating] = useState(false);

  // Check if the selected metric can be auto-calculated
  const calculationConfig = metricCalculationMap[selectedType];
  const canAutoCalculate = calculationConfig?.canAutoCalculate ?? false;

  // Handle auto-calculation button click
  const handleAutoCalculate = async () => {
    setIsCalculating(true);
    try {
      const calculatedValue = await MetricAPI.calculateMetric(selectedType);
      if (calculatedValue !== null && calculatedValue !== undefined) {
        setValue('value', calculatedValue);
      }
    } catch (error) {
      console.error('Failed to calculate metric:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Update unit label when type changes
  useEffect(() => {
    // This is just to trigger re-render, no actual state change needed
  }, [selectedType]);

  const onFormSubmit = handleSubmit(async (data) => {
    onSubmit(data);
  });

  const categoriesWithLabels = {
    [m.health_composition()]: metricsByCategory.health_composition,
    [m.cardiac()]: metricsByCategory.cardiac,
    [m.performance_physiology()]: metricsByCategory.performance_physiology,
  };

  return (
    <FormProvider
      methods={methods}
      onSubmit={onFormSubmit}
      className={className}
    >
      <div className="space-y-4">
        {!hideTypeSelector && (
          <RHFSelect
            name="type"
            label={m.metric_type()}
            required
            placeholder={m.select_metric_type()}
          >
            {Object.entries(categoriesWithLabels).map(
              ([category, types], idx) => (
                <div key={category}>
                  {idx > 0 && <div className="h-px bg-border my-1" />}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {metricTypeLabelMap[type]}
                    </SelectItem>
                  ))}
                </div>
              ),
            )}
          </RHFSelect>
        )}

        <RHFDatePicker name="date" label="Date" required />

        <div className="space-y-2">
          <RHFTextField
            name="value"
            type="number"
            label={`${m.value()} (${metricUnitMap[selectedType]})`}
            required
            step="0.01"
          />
          {canAutoCalculate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoCalculate}
              disabled={isCalculating}
              className="w-full"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? m.calculating() : m.calculate_automatically()}
            </Button>
          )}
        </div>

        <RHFTextarea
          name="notes"
          label={m.notes()}
          placeholder={m.optional()}
          className="min-h-[80px]"
        />

        <Button type="submit" className="w-full">
          {m.save()}
        </Button>
      </div>
    </FormProvider>
  );
}
