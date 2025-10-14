import { m } from '@/paraglide/messages';
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from '@/services/event';
import { eventTypeLabelMap, sportTypeLabelMap } from '@/utils/label-map/core';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  EVENT_TYPE,
  Event,
  SPORT_TYPE,
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
  const [workoutSteps, setWorkoutSteps] = useState<any[]>([]);

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

  const methods = useForm<any>({
    // Skip validation for workout field - we handle it separately
    resolver: undefined,
    defaultValues: edit
      ? rest.event
      : create
        ? {
            type: rest.type,
            name: '',
            description: '',
            startDate,
            endDate,
          }
        : {},
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;
  console.log('[CreateEventDialog] errors:', errors);

  const onSubmit = handleSubmit(async (data: any) => {
    console.log('[CreateEventDialog] onSubmit - workoutSteps:', workoutSteps);
    console.log(
      '[CreateEventDialog] onSubmit - workoutSteps JSON:',
      JSON.stringify(workoutSteps, null, 2),
    );

    // For training events, include workout data if there are steps
    if (data.type === EVENT_TYPE.TRAINING && workoutSteps.length > 0) {
      const eventWithWorkout = {
        ...data,
        athleteId,
        workout: {
          name: data.name || 'Workout',
          description: data.description || null,
          steps: workoutSteps,
        },
      };

      console.log(
        '[CreateEventDialog] Sending eventWithWorkout:',
        JSON.stringify(eventWithWorkout, null, 2),
      );

      if (create) {
        createEventMutation.mutate(eventWithWorkout as any);
      } else if (edit && rest.event) {
        updateEventMutation.mutate({
          eventId: rest.event.eventId,
          body: eventWithWorkout as any,
        });
      }
    } else {
      // For non-training events or training without workouts
      if (create) {
        createEventMutation.mutate({ ...data, athleteId } as any);
      } else if (edit && rest.event) {
        updateEventMutation.mutate({
          eventId: rest.event.eventId,
          body: data as any,
        });
      }
    }
  });

  // Callback to receive workout steps from WorkoutBuilder
  const handleStepsChange = useCallback((steps: any[]) => {
    console.log(
      '[CreateEventDialog] handleStepsChange RAW steps:',
      JSON.stringify(steps, null, 2),
    );

    // Clean workout steps: remove ALL DB-only fields for validation
    const cleanedSteps = steps.map((step) => {
      // Remove step DB fields
      const { workoutStepId, workoutId, createdAt, updatedAt, ...stepData } =
        step;

      // Clean targets
      const cleanedTargets = step.targets?.map((target: any) => {
        const {
          workoutStepTargetId,
          stepId,
          createdAt,
          updatedAt,
          ...targetData
        } = target;
        return targetData;
      });

      // Clean repeat block child steps if they exist
      let cleanedRepeatBlock = stepData.repeatBlock;
      if (stepData.repeatBlock?.childSteps) {
        cleanedRepeatBlock = {
          ...stepData.repeatBlock,
          childSteps: stepData.repeatBlock.childSteps.map((childStep: any) => {
            const {
              workoutStepId,
              workoutId,
              createdAt,
              updatedAt,
              ...childStepData
            } = childStep;
            const cleanedChildTargets = childStep.targets?.map(
              (target: any) => {
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
          }),
        };
      }

      return {
        ...stepData,
        targets: cleanedTargets,
        repeatBlock: cleanedRepeatBlock,
      };
    });

    console.log(
      '[CreateEventDialog] CLEANED steps:',
      JSON.stringify(cleanedSteps, null, 2),
    );
    setWorkoutSteps(cleanedSteps);
  }, []);

  const startDateValue = watch('startDate');
  const goalDistanceValue = watch('goalDistance');
  const goalDurationValue = watch('goalDuration');

  if ((create && (!rest.date || !rest.type)) || (edit && !rest.event)) {
    return null;
  }
  const type = create
    ? rest.type || EVENT_TYPE.TRAINING
    : edit
      ? rest.event?.type || EVENT_TYPE.TRAINING
      : EVENT_TYPE.TRAINING;

  // Check if there's an existing workout when editing
  const existingWorkout =
    edit && type === EVENT_TYPE.TRAINING && 'event' in rest
      ? (rest.event as any)?.workout
      : null;

  const isTraining = type === EVENT_TYPE.TRAINING;
  const sportValue = watch('sport');
  const nameValue = watch('name');
  const descriptionValue = watch('description');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {edit ? m.edit() : m.plan()} {m.a()} {eventTypeLabelMap[type]}
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
                  onChange={(value) => {
                    const start = new Date(startDateValue);
                    const duration = value || 0;
                    const end = new Date(start);
                    end.setSeconds(start.getSeconds() + duration);
                    setValue('endDate', end);
                  }}
                />
                {!!goalDistanceValue && !!goalDurationValue && (
                  <div className="text-sm text-gray-500 flex items-center col-span-2">
                    {m.pace()}:{' '}
                    {formatSpeed(
                      goalDistanceValue / goalDurationValue,
                      'min/km',
                    )}{' '}
                    {m.per_km()} -{' '}
                    {formatSpeed(goalDistanceValue / goalDurationValue, 'km/h')}{' '}
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
                workoutMetadata={{
                  name: nameValue || '',
                  description: descriptionValue || '',
                  sport: sportValue as SPORT_TYPE,
                }}
              />
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            onClick={onSubmit}
            isLoading={createEventMutation.isPending}
          >
            {edit ? m.edit() : m.create()} {m.the()}
            {eventTypeLabelMap[type]}
          </Button>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
