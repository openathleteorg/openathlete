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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Available target types - labels will be translated dynamically
const TARGET_TYPES = [
  { value: 'PACE', getLabelFn: () => m.target_form_type_pace() },
  { value: 'HEARTRATE', getLabelFn: () => m.target_form_type_heartrate() },
  { value: 'POWER', getLabelFn: () => m.target_form_type_power() },
  { value: 'CADENCE', getLabelFn: () => m.target_form_type_cadence() },
  { value: 'SPEED', getLabelFn: () => m.target_form_type_speed() },
  { value: 'WEIGHT', getLabelFn: () => m.target_form_type_weight() },
  { value: 'REPS_TARGET', getLabelFn: () => m.target_form_type_reps() },
] as const;

// Zod schema matching backend structure
const targetFormSchema = z.object({
  targetType: z.string(),
  targetMin: z.number().nullable().optional(),
  targetMax: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  targetZone: z.number().nullable().optional(),
});

type TargetFormValues = z.infer<typeof targetFormSchema>;

interface TargetFormProps {
  initialValues?: Partial<TargetFormValues>;
  onSubmit: (values: TargetFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
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
}: TargetFormProps) {
  const [useRange, setUseRange] = useState(
    !!(initialValues?.targetMin || initialValues?.targetMax),
  );

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      targetType: initialValues?.targetType || 'HEARTRATE',
      targetMin: initialValues?.targetMin || null,
      targetMax: initialValues?.targetMax || null,
      targetValue: initialValues?.targetValue || null,
      targetZone: initialValues?.targetZone || null,
    },
  });

  const selectedTargetType = form.watch('targetType');

  // Get unit label based on target type
  const getUnitLabel = (type: string) => {
    switch (type) {
      case 'PACE':
        return 'sec/km';
      case 'HEARTRATE':
        return 'bpm';
      case 'POWER':
        return 'watts';
      case 'CADENCE':
        return 'spm';
      case 'SPEED':
        return 'km/h';
      case 'WEIGHT':
        return 'kg';
      case 'REPS_TARGET':
        return 'reps';
      default:
        return '';
    }
  };

  const unitLabel = getUnitLabel(selectedTargetType);

  const handleSubmit = (values: TargetFormValues) => {
    // Clear unused fields based on range toggle
    const cleanedValues = {
      ...values,
      targetMin: useRange ? values.targetMin : null,
      targetMax: useRange ? values.targetMax : null,
      targetValue: !useRange ? values.targetValue : null,
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

        {/* Range Toggle */}
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

        {/* Conditional Fields Based on Range Toggle */}
        {useRange ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Min Value */}
            <FormField
              control={form.control}
              name="targetMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{m.target_form_min_value()}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? null : Number(value));
                        }}
                      />
                      {unitLabel && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          {unitLabel}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max Value */}
            <FormField
              control={form.control}
              name="targetMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{m.target_form_max_value()}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? null : Number(value));
                        }}
                      />
                      {unitLabel && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          {unitLabel}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          /* Single Value */
          <FormField
            control={form.control}
            name="targetValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{m.target_form_single_value()}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? null : Number(value));
                      }}
                    />
                    {unitLabel && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        {unitLabel}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Training Zone (optional) */}
        <FormField
          control={form.control}
          name="targetZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.target_form_training_zone()}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={m.target_form_training_zone_placeholder()}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? null : Number(value));
                  }}
                />
              </FormControl>
              <FormDescription>
                {m.target_form_training_zone_description()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
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
