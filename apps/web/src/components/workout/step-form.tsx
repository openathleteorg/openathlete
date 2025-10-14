import { RHFTimePicker } from '@/components/hook-form/rhf-time-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import * as m from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SPORT_TYPE } from '@openathlete/shared';
import type { WorkoutStepDto } from '@openathlete/shared';

import { ExercisePicker } from './exercise-picker';
import { TargetBadge } from './target-badge';
import { TargetForm } from './target-form';
import { TypeIcon } from './type-icon';

// Step types and duration types will use i18n functions
const STEP_TYPE_VALUES = [
  'WARMUP',
  'COOLDOWN',
  'INTERVAL_ACTIVE',
  'INTERVAL_REST',
  'STEADY',
  'FREE',
] as const;

const DURATION_TYPE_VALUES = ['TIME', 'DISTANCE', 'REPS', 'OPEN'] as const;

// Zod schema for step form
const stepFormSchema = z.object({
  stepType: z.string(),
  name: z.string().nullable().optional(),
  exerciseName: z.string().nullable().optional(),
  durationType: z.string(),
  durationValue: z.number().nullable().optional(),
  durationTime: z.date().optional(), // Temporary field for time picker
  notes: z.string().nullable().optional(),
});

type StepFormValues = z.infer<typeof stepFormSchema>;

// Target with temp ID for UI
type TargetWithId = {
  id: string;
  targetType: string;
  targetMin: number | null | undefined;
  targetMax: number | null | undefined;
  targetValue: number | null | undefined;
  targetZone: number | null | undefined;
};

interface StepFormProps {
  initialValues?: Partial<WorkoutStepDto>;
  onSubmit: (values: StepFormValues & { targets: TargetWithId[] }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  sport?: keyof typeof SPORT_TYPE; // Sport type to determine if exercise name should be shown
}

// Utility functions for time conversion
const secondsToDate = (
  seconds: number | null | undefined,
): Date | undefined => {
  if (seconds == null) return undefined;
  const date = new Date(0); // Start from epoch
  date.setHours(Math.floor(seconds / 3600));
  date.setMinutes(Math.floor((seconds % 3600) / 60));
  date.setSeconds(seconds % 60);
  return date;
};

const dateToSeconds = (date: Date | undefined): number | null => {
  if (!date) return null;
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
};

/**
 * Form for creating or editing a workout step
 * Supports conditional fields based on step type and sport
 * Manages targets list with add/remove functionality
 */
export function StepForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save Step',
  cancelLabel = 'Cancel',
  sport = 'RUNNING',
}: StepFormProps) {
  const [targets, setTargets] = useState<TargetWithId[]>(
    initialValues?.targets?.map((t: any, idx: number) => ({
      id: `existing-${idx}`,
      targetType: t.targetType,
      targetMin: t.targetMin,
      targetMax: t.targetMax,
      targetValue: t.targetValue,
      targetZone: t.targetZone,
    })) || [],
  );
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);

  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      stepType: initialValues?.stepType || 'STEADY',
      name: initialValues?.name || null,
      exerciseName: initialValues?.exerciseName || null,
      durationType: initialValues?.durationType || 'TIME',
      durationValue: initialValues?.durationValue || null,
      durationTime: secondsToDate(initialValues?.durationValue),
      notes: initialValues?.notes || null,
    },
  });

  const selectedDurationType = form.watch('durationType');

  // Check if sport is strength-based
  const isStrength =
    sport === 'STRENGTH' || sport === 'CROSSFIT' || sport === 'YOGA';

  // Get duration unit label
  const getDurationUnit = (type: string) => {
    switch (type) {
      case 'TIME':
        return 'seconds';
      case 'DISTANCE':
        return 'meters';
      case 'REPS':
        return 'repetitions';
      default:
        return '';
    }
  };

  // Add target
  const handleAddTarget = (targetValues: any) => {
    setTargets([
      ...targets,
      {
        id: `temp-${Date.now()}`,
        ...targetValues,
      },
    ]);
    setIsTargetDialogOpen(false);
  };

  // Remove target
  const handleRemoveTarget = (id: string) => {
    setTargets(targets.filter((t) => t.id !== id));
  };

  // Submit form with targets
  const handleSubmit = (values: StepFormValues) => {
    onSubmit({
      ...values,
      targets,
    });
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
        {/* Step Type */}
        <FormField
          control={form.control}
          name="stepType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.step_form_type()}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={m.step_form_type_placeholder()} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STEP_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <TypeIcon stepType={type as any} size="sm" />
                        <span>
                          {type === 'WARMUP' && m.step_form_type_warmup()}
                          {type === 'COOLDOWN' && m.step_form_type_cooldown()}
                          {type === 'INTERVAL_ACTIVE' &&
                            m.step_form_type_interval_active()}
                          {type === 'INTERVAL_REST' &&
                            m.step_form_type_interval_rest()}
                          {type === 'STEADY' && m.step_form_type_steady()}
                          {type === 'FREE' && m.step_form_type_free()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {m.step_form_type_description()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name (optional) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.step_form_name()}</FormLabel>
              <FormControl>
                <Input
                  placeholder={m.step_form_name_placeholder()}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                {m.step_form_name_description()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Exercise Name (for strength sports) */}
        {isStrength && (
          <FormField
            control={form.control}
            name="exerciseName"
            render={({ field }) => (
              <FormItem>
                <ExercisePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  label={m.step_form_exercise()}
                  placeholder={m.step_form_exercise_placeholder()}
                />
                <FormDescription>
                  {m.step_form_exercise_description()}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Duration Type */}
        <FormField
          control={form.control}
          name="durationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.step_form_duration_type()}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={m.step_form_duration_type_placeholder()}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DURATION_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'TIME' && m.step_form_duration_type_time()}
                      {type === 'DISTANCE' &&
                        m.step_form_duration_type_distance()}
                      {type === 'REPS' && m.step_form_duration_type_reps()}
                      {type === 'OPEN' && m.step_form_duration_type_open()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {m.step_form_duration_type_description()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration Value (conditional) */}
        {selectedDurationType !== 'OPEN' && (
          <>
            {selectedDurationType === 'TIME' ? (
              <RHFTimePicker
                name="durationTime"
                label={m.step_form_duration_value()}
                onChange={(date) => {
                  // Sync durationTime to durationValue
                  form.setValue('durationValue', dateToSeconds(date));
                }}
              />
            ) : (
              <FormField
                control={form.control}
                name="durationValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{m.step_form_duration_value()}</FormLabel>
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          {getDurationUnit(selectedDurationType)}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {selectedDurationType === 'DISTANCE' &&
                        m.step_form_duration_distance_description()}
                      {selectedDurationType === 'REPS' &&
                        m.step_form_duration_reps_description()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {/* Targets Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>{m.step_form_targets()}</FormLabel>
            <Dialog
              open={isTargetDialogOpen}
              onOpenChange={setIsTargetDialogOpen}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {m.step_form_add_target()}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{m.step_form_add_target_title()}</DialogTitle>
                  <DialogDescription>
                    {m.step_form_add_target_description()}
                  </DialogDescription>
                </DialogHeader>
                <TargetForm
                  onSubmit={handleAddTarget}
                  onCancel={() => setIsTargetDialogOpen(false)}
                  submitLabel={m.step_form_add_target()}
                />
              </DialogContent>
            </Dialog>
          </div>

          {targets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {targets.map((target) => (
                <div key={target.id} className="relative group">
                  <TargetBadge target={target as any} />
                  <button
                    type="button"
                    onClick={() => handleRemoveTarget(target.id)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Remove target"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {m.step_form_no_targets()}
            </p>
          )}
        </div>

        {/* Notes (optional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{m.step_form_notes()}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={m.step_form_notes_placeholder()}
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                {m.step_form_notes_description()}
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
