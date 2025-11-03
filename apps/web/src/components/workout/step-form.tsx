import { RHFDistance } from '@/components/hook-form/rhf-distance';
import { RHFDuration } from '@/components/hook-form/rhf-duration';
import { RHFNumberWithUnit } from '@/components/hook-form/rhf-number-with-unit';
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

import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
} from '@openathlete/shared';
import type { WorkoutStepDto, WorkoutStepTarget } from '@openathlete/shared';

import { ExercisePicker } from './exercise-picker';
import { TargetBadge } from './target-badge';
import { TargetForm } from './target-form';
import { TypeIcon } from './type-icon';

const STEP_TYPE_VALUES = [
  WORKOUT_STEP_TYPE.WARMUP,
  WORKOUT_STEP_TYPE.COOLDOWN,
  WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  WORKOUT_STEP_TYPE.INTERVAL_REST,
  WORKOUT_STEP_TYPE.STEADY,
  WORKOUT_STEP_TYPE.FREE,
] as const;

const DURATION_TYPE_VALUES = [
  WORKOUT_DURATION_TYPE.TIME,
  WORKOUT_DURATION_TYPE.DISTANCE,
  WORKOUT_DURATION_TYPE.REPS,
  WORKOUT_DURATION_TYPE.OPEN,
] as const;

const stepFormSchema = z.object({
  stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
  name: z.string().nullable().optional(),
  exerciseName: z.string().nullable().optional(),
  durationType: z.nativeEnum(WORKOUT_DURATION_TYPE),
  durationValue: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type StepFormValues = z.infer<typeof stepFormSchema>;

type TargetWithId = {
  id: string;
  targetType: WorkoutStepTarget['targetType'];
  targetMin: WorkoutStepTarget['targetMin'];
  targetMax: WorkoutStepTarget['targetMax'];
  targetValue: WorkoutStepTarget['targetValue'];
};

interface StepFormProps {
  initialValues?: Partial<WorkoutStepDto>;
  onSubmit: (values: StepFormValues & { targets: TargetWithId[] }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  sport?: keyof typeof SPORT_TYPE;
}

export function StepForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save Step',
  cancelLabel = 'Cancel',
  sport = 'RUNNING',
}: StepFormProps) {
  const [targets, setTargets] = useState<TargetWithId[]>(
    initialValues?.targets?.map((t: WorkoutStepTarget, idx: number) => ({
      id: `existing-${idx}`,
      targetType: t.targetType,
      targetMin: t.targetMin,
      targetMax: t.targetMax,
      targetValue: t.targetValue,
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
      notes: initialValues?.notes || null,
    },
  });

  const selectedDurationType = form.watch('durationType');

  const isStrength =
    sport === 'STRENGTH' || sport === 'CROSSFIT' || sport === 'YOGA';

  const handleAddTarget = (targetValues: Partial<Omit<TargetWithId, 'id'>>) => {
    setTargets([
      ...targets,
      {
        id: `temp-${Date.now()}`,
        targetType: targetValues.targetType!,
        targetMin: targetValues.targetMin ?? null,
        targetMax: targetValues.targetMax ?? null,
        targetValue: targetValues.targetValue ?? null,
      },
    ]);
    setIsTargetDialogOpen(false);
  };

  const handleRemoveTarget = (id: string) => {
    setTargets(targets.filter((t) => t.id !== id));
  };

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
        <div className="flex items-center gap-4 w-full">
          <FormField
            control={form.control}
            name="stepType"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{m.step_form_type()}</FormLabel>

                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue
                        placeholder={m.step_form_type_placeholder()}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STEP_TYPE_VALUES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <TypeIcon stepType={type} size="sm" />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationType"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{m.step_form_duration_type()}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        {selectedDurationType !== 'OPEN' && (
          <>
            {selectedDurationType === 'TIME' ? (
              <RHFDuration
                name="durationValue"
                label={m.step_form_duration_value()}
                showSeconds={true}
              />
            ) : selectedDurationType === 'DISTANCE' ? (
              <RHFDistance
                name="durationValue"
                label={m.step_form_duration_value()}
              />
            ) : selectedDurationType === 'REPS' ? (
              <>
                <RHFNumberWithUnit
                  name="durationValue"
                  label={m.step_form_duration_value()}
                  unit={m.unit_repetitions()}
                  min={0}
                />
                <FormDescription>
                  {m.step_form_duration_reps_description()}
                </FormDescription>
              </>
            ) : null}
          </>
        )}

        <div className="space-y-2 my-5">
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
                  sport={sport}
                />
              </DialogContent>
            </Dialog>
          </div>

          {targets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {targets.map((target) => (
                <div key={target.id} className="relative group">
                  <TargetBadge
                    target={
                      {
                        targetType: target.targetType,
                        targetMin: target.targetMin,
                        targetMax: target.targetMax,
                        targetValue: target.targetValue,
                      } as unknown as WorkoutStepTarget
                    }
                  />
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
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormMessage />
            </FormItem>
          )}
        />

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
