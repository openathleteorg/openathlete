import { useCreateEventMutation, useUpdateEventMutation } from '@/api/event';
import { m } from '@/paraglide/messages';
import { eventTypeLabelMap, sportTypeLabelMap } from '@/utils/label-map/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  UpdateEventDto,
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTarget,
} from '@openathlete/shared';
import {
  EVENT_TYPE,
  Event,
  SPORT_TYPE,
  calculateWorkoutDuration,
  formatSpeed,
} from '@openathlete/shared';

import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import {
  FormProvider,
  RHFDistance,
  RHFDuration,
  RHFSelect,
  RHFTextField,
} from '../hook-form';
import { RHFElevation } from '../hook-form/rhf-elevation';
import { RHFRpe } from '../hook-form/rhf-rpe';
import { RHFTextarea } from '../hook-form/rhf-textarea';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { SelectItem } from '../ui/select';
import { WorkoutBuilder } from '../workout';

type P =
  | {
      open: boolean;
      onClose: () => void;
      date?: Date;
      type?: EVENT_TYPE;
      prefilledData?: CreateEventDto;
    }
  | {
      open: boolean;
      onClose: () => void;
      event?: Event;
    };

export function CreateEventDialog({ open, onClose, ...rest }: P) {
  const { athleteId } = useCalendarContext();
  const edit = 'event' in rest;
  const create = 'type' in rest && 'date' in rest;
  const [workoutSteps, setWorkoutSteps] = useState<CreateWorkoutStepDto[]>([]);

  const startDate = useMemo(() => {
    if (create) {
      if (!rest.date) return undefined;
      const d = new Date(rest.date);
      d.setHours(8);
      d.setMinutes(0);
      d.setSeconds(0);
      return d;
    } else if (edit) {
      return rest.event?.startDate;
    }
  }, [rest]);
  const endDate = useMemo(() => {
    if (create) {
      if (!rest.date) return undefined;
      const d = new Date(rest.date);
      d.setHours(9);
      d.setMinutes(0);
      d.setSeconds(0);
      return d;
    } else if (edit) {
      return rest.event?.endDate;
    }
  }, [rest]);

  const createEventMutation = useCreateEventMutation({
    onSuccess: () => {
      toast.success(m.event_created_successfully());
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });

  const updateEventMutation = useUpdateEventMutation({
    onSuccess: () => {
      toast.success(m.event_updated_successfully());
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_update_event());
    },
  });

  // Form schema for validation - uses Date objects (not z.coerce.date)
  const baseEventFormSchema = z.object({
    startDate: z.date({
      required_error: m.required(),
    }),
    endDate: z.date({
      required_error: m.required(),
    }),
    name: z.string().min(1, m.required()).max(100),
    description: z.string().optional(),
  });

  const trainingEventFormSchema = baseEventFormSchema.extend({
    type: z.literal(EVENT_TYPE.TRAINING),
    sport: z.nativeEnum(SPORT_TYPE, {
      required_error: m.required(),
    }),
    description: z.string(),
    goalDistance: z.number().optional().nullable(),
    goalDuration: z.number().optional().nullable(),
    goalElevationGain: z.number().optional().nullable(),
    goalRpe: z.number().optional().nullable(),
  });

  const competitionEventFormSchema = baseEventFormSchema.extend({
    type: z.literal(EVENT_TYPE.COMPETITION),
    sport: z.nativeEnum(SPORT_TYPE, {
      required_error: m.required(),
    }),
    description: z.string(),
    goalDistance: z.number().optional().nullable(),
    goalDuration: z.number().optional().nullable(),
    goalElevationGain: z.number().optional().nullable(),
    goalRpe: z.number().optional().nullable(),
  });

  const noteEventFormSchema = baseEventFormSchema.extend({
    type: z.literal(EVENT_TYPE.NOTE),
    description: z.string().min(1, m.required()),
  });

  const activityEventFormSchema = baseEventFormSchema.extend({
    type: z.literal(EVENT_TYPE.ACTIVITY),
    sport: z.nativeEnum(SPORT_TYPE, {
      required_error: m.required(),
    }),
    description: z.string().optional(),
    rpe: z.number().optional().nullable(),
  });

  const eventFormSchema = z.discriminatedUnion('type', [
    trainingEventFormSchema,
    competitionEventFormSchema,
    noteEventFormSchema,
    activityEventFormSchema,
  ]);

  type EventFormValues = z.infer<typeof eventFormSchema>;

  const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues:
      edit && rest.event
        ? (() => {
            const base = {
              type: rest.event!.type,
              name: rest.event!.name,
              description: (rest.event as any).description ?? '',
              startDate: rest.event!.startDate,
              endDate: rest.event!.endDate,
            } as EventFormValues;
            if (rest.event!.type === EVENT_TYPE.TRAINING) {
              return {
                ...base,
                sport: (rest.event as any).sport,
                goalDistance: (rest.event as any).goalDistance ?? null,
                goalDuration: (rest.event as any).goalDuration ?? null,
                goalElevationGain:
                  (rest.event as any).goalElevationGain ?? null,
                goalRpe: (rest.event as any).goalRpe ?? null,
              } as EventFormValues;
            }
            if (rest.event!.type === EVENT_TYPE.COMPETITION) {
              return {
                ...base,
                sport: (rest.event as any).sport,
                goalDistance: (rest.event as any).goalDistance ?? null,
                goalDuration: (rest.event as any).goalDuration ?? null,
                goalElevationGain:
                  (rest.event as any).goalElevationGain ?? null,
                goalRpe: (rest.event as any).goalRpe ?? null,
              } as EventFormValues;
            }
            if (rest.event!.type === EVENT_TYPE.ACTIVITY) {
              return {
                ...base,
                sport: (rest.event as any).sport,
                rpe: (rest.event as any).rpe ?? null,
              } as EventFormValues;
            }
            return base;
          })()
        : create && rest.prefilledData
          ? (() => {
              const prefilled = rest.prefilledData;
              const base = {
                type: prefilled.type,
                name: prefilled.name,
                description: (prefilled as any).description ?? '',
                startDate: prefilled.startDate,
                endDate: prefilled.endDate,
              } as EventFormValues;
              if (prefilled.type === EVENT_TYPE.TRAINING) {
                return {
                  ...base,
                  sport: (prefilled as any).sport,
                  goalDistance: (prefilled as any).goalDistance ?? null,
                  goalDuration: (prefilled as any).goalDuration ?? null,
                  goalElevationGain:
                    (prefilled as any).goalElevationGain ?? null,
                  goalRpe: (prefilled as any).goalRpe ?? null,
                } as EventFormValues;
              }
              if (prefilled.type === EVENT_TYPE.COMPETITION) {
                return {
                  ...base,
                  sport: (prefilled as any).sport,
                  goalDistance: (prefilled as any).goalDistance ?? null,
                  goalDuration: (prefilled as any).goalDuration ?? null,
                  goalElevationGain:
                    (prefilled as any).goalElevationGain ?? null,
                  goalRpe: (prefilled as any).goalRpe ?? null,
                } as EventFormValues;
              }
              if (prefilled.type === EVENT_TYPE.ACTIVITY) {
                return {
                  ...base,
                  sport: (prefilled as any).sport,
                  rpe: (prefilled as any).rpe ?? null,
                } as EventFormValues;
              }
              return base;
            })()
          : create
            ? {
                type: rest.type!,
                name: '',
                description: '',
                startDate: startDate!,
                endDate: endDate!,
              }
            : undefined,
  });

  const { handleSubmit, setValue, watch } = methods;

  useEffect(() => {
    const hasPrefilledData = 'prefilledData' in rest && !!rest.prefilledData;
    if (
      create &&
      hasPrefilledData &&
      rest.prefilledData &&
      rest.prefilledData.type === EVENT_TYPE.TRAINING
    ) {
      const prefilled = rest.prefilledData;
      const hasWorkout = 'workout' in prefilled && !!prefilled.workout;
      if (
        hasWorkout &&
        prefilled.workout?.steps &&
        prefilled.workout.steps.length > 0
      ) {
        setWorkoutSteps(prefilled.workout.steps);
      } else {
        setWorkoutSteps([]);
      }
    } else if (
      edit &&
      'event' in rest &&
      rest.event &&
      rest.event.type === EVENT_TYPE.TRAINING
    ) {
      const existingWorkout = (rest.event as { workout?: WorkoutDto })?.workout;
      if (existingWorkout?.steps) {
        setWorkoutSteps(
          existingWorkout.steps.map((step) => {
            const {
              workoutStepId,
              workoutId,
              createdAt,
              updatedAt,
              ...stepData
            } = step;
            return stepData as CreateWorkoutStepDto;
          }),
        );
      }
    } else {
      setWorkoutSteps([]);
    }
  }, [
    create,
    edit,
    'prefilledData' in rest ? rest.prefilledData : null,
    'event' in rest ? rest.event : null,
  ]);

  const onSubmit = handleSubmit(async (data: EventFormValues) => {
    if (data.type === EVENT_TYPE.TRAINING && workoutSteps.length > 0) {
      const eventWithWorkout = {
        ...data,
        athleteId,
        workout: {
          steps: workoutSteps,
        },
      };

      if (create) {
        createEventMutation.mutate(eventWithWorkout as CreateEventDto);
      } else if (edit && rest.event) {
        updateEventMutation.mutate({
          eventId: rest.event.eventId,
          body: eventWithWorkout as UpdateEventDto,
        });
      }
    } else {
      if (create) {
        createEventMutation.mutate({ ...(data as CreateEventDto), athleteId });
      } else if (edit && rest.event) {
        updateEventMutation.mutate({
          eventId: rest.event.eventId,
          body: data as UpdateEventDto,
        });
      }
    }
  });

  const handleStepsChange = useCallback((steps: WorkoutStepDto[]) => {
    const cleanedSteps: CreateWorkoutStepDto[] = steps.map((step) => {
      const { workoutStepId, workoutId, createdAt, updatedAt, ...stepData } =
        step;

      const cleanedTargets = step.targets?.map((target: WorkoutStepTarget) => {
        const {
          workoutStepTargetId,
          stepId,
          createdAt,
          updatedAt,
          ...targetData
        } = target;
        return targetData;
      });

      let cleanedRepeatBlock = stepData.repeatBlock;
      if (stepData.repeatBlock?.childSteps) {
        cleanedRepeatBlock = {
          ...stepData.repeatBlock,
          childSteps: stepData.repeatBlock.childSteps.map(
            (childStep: WorkoutStepDto) => {
              const {
                workoutStepId,
                workoutId,
                createdAt,
                updatedAt,
                ...childStepData
              } = childStep;
              const cleanedChildTargets = childStep.targets?.map(
                (target: WorkoutStepTarget) => {
                  const {
                    workoutStepTargetId,
                    stepId,
                    createdAt,
                    updatedAt,
                    ...targetData
                  } = target;
                  return targetData;
                },
              );
              return {
                ...childStepData,
                targets: cleanedChildTargets,
              };
            },
          ),
        };
      }

      return {
        ...stepData,
        targets: cleanedTargets,
        repeatBlock: cleanedRepeatBlock,
      };
    });
    setWorkoutSteps(cleanedSteps);
  }, []);

  const startDateValue = watch('startDate');
  const goalDistanceValue = watch('goalDistance');
  const goalDurationValue = watch('goalDuration');

  // Calculate total duration from workout steps
  const calculatedDuration = useMemo(() => {
    if (workoutSteps.length === 0) {
      return null;
    }
    // Convert CreateWorkoutStepDto[] to WorkoutDto for calculation
    const workout = {
      steps: workoutSteps.map((step, index) => ({
        ...step,
        workoutStepId: -(Date.now() + index),
        orderIndex: index,
      })) as WorkoutStepDto[],
      eventTrainingId: 0, // Not used by calculateWorkoutDuration
    } as WorkoutDto;
    return calculateWorkoutDuration(workout);
  }, [workoutSteps]);

  const hasStepsWithDuration = calculatedDuration !== null;

  // Update goalDuration when calculated duration changes
  useEffect(() => {
    if (hasStepsWithDuration && calculatedDuration !== null) {
      setValue('goalDuration', calculatedDuration);
      // Update endDate based on calculated duration
      const start = new Date(startDateValue);
      const end = new Date(start);
      end.setSeconds(start.getSeconds() + calculatedDuration);
      setValue('endDate', end);
    }
  }, [calculatedDuration, hasStepsWithDuration, setValue, startDateValue]);

  if (
    (create &&
      (!('date' in rest) || !rest.date || !('type' in rest) || !rest.type)) ||
    (edit && (!('event' in rest) || !rest.event))
  ) {
    return null;
  }
  const type = create
    ? ('type' in rest && rest.type) || EVENT_TYPE.TRAINING
    : edit
      ? ('event' in rest && rest.event?.type) || EVENT_TYPE.TRAINING
      : EVENT_TYPE.TRAINING;

  // Memoize workout steps to avoid recreating the workout object on every render
  const workoutStepsKey = useMemo(() => {
    return workoutSteps
      .map((s) => `${s.stepType}-${s.name}-${s.durationValue}`)
      .join('|');
  }, [workoutSteps]);

  const existingWorkout = useMemo(() => {
    if (edit && type === EVENT_TYPE.TRAINING && 'event' in rest) {
      return (rest.event as { workout?: WorkoutDto })?.workout ?? null;
    }
    if (create && type === EVENT_TYPE.TRAINING && workoutSteps.length > 0) {
      return {
        steps: workoutSteps.map((step, index) => ({
          ...step,
          workoutStepId: -(Date.now() + index),
          orderIndex: index,
        })) as WorkoutStepDto[],
      } as WorkoutDto;
    }
    return null;
  }, [
    edit,
    create,
    type,
    'event' in rest ? rest.event : null,
    workoutStepsKey,
  ]);

  const isTraining = type === EVENT_TYPE.TRAINING;
  const sportValue = watch('sport');
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {edit ? m.edit() : m.plan()} {m.a()}{' '}
            {eventTypeLabelMap[type as keyof typeof eventTypeLabelMap]}
          </DialogTitle>
        </DialogHeader>
        <FormProvider
          methods={methods}
          onSubmit={onSubmit}
          className="space-y-6 pt-3"
        >
          {/* Event metadata fields */}
          <div className="grid grid-cols-2 gap-6">
            <RHFTextField
              name="name"
              type="text"
              placeholder={m.morning_run()}
              label={m.event_name()}
              required
            />
            {type === EVENT_TYPE.TRAINING ||
            type === EVENT_TYPE.COMPETITION ||
            type === EVENT_TYPE.ACTIVITY ? (
              <RHFSelect
                name="sport"
                label={m.sport()}
                required
                placeholder={m.select_a_sport()}
              >
                {Object.values(SPORT_TYPE).map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sportTypeLabelMap[sport]}
                  </SelectItem>
                ))}
              </RHFSelect>
            ) : (
              <div />
            )}
            <div className="col-span-2">
              <RHFTextarea
                name="description"
                label={m.description()}
                className="h-24"
                required={type === EVENT_TYPE.NOTE}
              />
            </div>
            {(type === EVENT_TYPE.TRAINING ||
              type === EVENT_TYPE.COMPETITION) && (
              <>
                <RHFDistance name="goalDistance" label={m.goal_distance()} />
                <RHFDuration
                  name="goalDuration"
                  label={m.goal_duration()}
                  disabled={hasStepsWithDuration}
                  onChange={(value) => {
                    if (!hasStepsWithDuration) {
                      const start = new Date(startDateValue);
                      const duration = value || 0;
                      const end = new Date(start);
                      end.setSeconds(start.getSeconds() + duration);
                      setValue('endDate', end);
                    }
                  }}
                />
                {!!goalDistanceValue && !!goalDurationValue && (
                  <div className="text-sm text-gray-500 flex items-center col-span-2">
                    {m.pace()}:{' '}
                    {formatSpeed(
                      Number(goalDistanceValue) / Number(goalDurationValue),
                      'min/km',
                    )}{' '}
                    {m.per_km()} -{' '}
                    {formatSpeed(
                      Number(goalDistanceValue) / Number(goalDurationValue),
                      'km/h',
                    )}{' '}
                    {m.kilometers_per_hour()}
                  </div>
                )}
                <RHFElevation
                  name="goalElevationGain"
                  label={m.goal_elevation_gain()}
                />
                <RHFRpe name="goalRpe" label={m.goal_rpe()} />
              </>
            )}
            {type === EVENT_TYPE.ACTIVITY && (
              <div className="col-span-2">
                <RHFRpe name="rpe" label={m.rpe()} />
              </div>
            )}
          </div>

          {/* Workout Builder for training events (integrated inline) */}
          {isTraining && (
            <div className="border-t pt-6">
              <WorkoutBuilder
                trainingId={
                  edit && 'event' in rest ? rest.event?.eventId || 0 : 0
                }
                workout={existingWorkout}
                hideMetadataForm={true}
                hideActions={true}
                onStepsChange={handleStepsChange}
                sport={sportValue ?? SPORT_TYPE.RUNNING}
              />
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={
              createEventMutation.isPending || updateEventMutation.isPending
            }
          >
            {edit ? m.edit() : m.create()} {m.the()}
            {eventTypeLabelMap[type as keyof typeof eventTypeLabelMap]}
          </Button>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
