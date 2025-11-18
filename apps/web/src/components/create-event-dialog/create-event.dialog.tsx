import { m } from '@/paraglide/messages';
import { eventTypeLabelMap } from '@/utils/label-map/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  Event,
  SPORT_TYPE,
  UpdateEventDto,
} from '@openathlete/shared';
import { EVENT_TYPE } from '@openathlete/shared';

import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import { FormProvider } from '../hook-form';
import { RHFCheckbox } from '../hook-form/rhf-checkbox';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AIModifyEventDialog } from './components/ai-modify-event-dialog';
import { EventFormFields } from './components/event-form-fields';
import { WorkoutSection } from './components/workout-section';
import { useCurrentEventData } from './hooks/use-current-event-data';
import { useEventFormSubmission } from './hooks/use-event-form-submission';
import { useWorkoutDuration } from './hooks/use-workout-duration';
import { useWorkoutSteps } from './hooks/use-workout-steps';
import { getEndDate, getStartDate } from './utils/date-helpers';
import {
  type EventFormValues,
  eventFormSchema,
} from './utils/event-form-schemas';
import { getFormDefaultValues } from './utils/form-default-values';

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
      isTemplate?: boolean;
    };

export function CreateEventDialog({ open, onClose, ...rest }: P) {
  const { athleteId } = useCalendarContext();
  const edit = 'event' in rest;
  const create = 'type' in rest && 'date' in rest;

  const type = create
    ? ('type' in rest && rest.type) || EVENT_TYPE.TRAINING
    : edit
      ? ('event' in rest && rest.event?.type) || EVENT_TYPE.TRAINING
      : EVENT_TYPE.TRAINING;

  // Calculate dates
  const startDate = useMemo(() => {
    if (create) {
      return getStartDate(rest.date);
    } else if (edit) {
      return rest.event?.startDate;
    }
  }, [create, edit, rest]);

  const endDate = useMemo(() => {
    if (create) {
      return getEndDate(rest.date);
    } else if (edit) {
      return rest.event?.endDate;
    }
  }, [create, edit, rest]);

  // Initialize form
  const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getFormDefaultValues(rest, startDate, endDate),
  });

  const { handleSubmit, setValue, watch } = methods;

  // Manage workout steps
  const { workoutSteps, setWorkoutSteps } = useWorkoutSteps(rest);

  // Calculate workout duration and update form
  const { hasStepsWithDuration } = useWorkoutDuration(
    workoutSteps,
    watch,
    setValue,
  );

  // Get current event data for AI modification
  const { currentEventData } = useCurrentEventData(
    rest,
    watch,
    workoutSteps,
    athleteId ?? 0,
  );

  // Handle form submission
  const { onSubmit, isSubmitting } = useEventFormSubmission(
    rest,
    athleteId ?? 0,
    workoutSteps,
    onClose,
  );

  // Watch form values for UI
  const startDateValue = watch('startDate');
  const goalDistanceValue = watch('goalDistance');
  const goalDurationValue = watch('goalDuration');
  const sportValue = watch('sport');

  // AI modification/generation dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  // Determine if we're in create mode (empty form)
  const formName = watch('name');
  const isCreateMode = !formName || formName.trim() === '';

  // Handle event generation (for create mode)
  const handleEventGenerated = (generatedEvent: CreateEventDto) => {
    // Update form with generated event data
    if (generatedEvent.name) setValue('name', generatedEvent.name);
    if (generatedEvent.description !== undefined)
      setValue('description', generatedEvent.description);
    if (generatedEvent.startDate)
      setValue('startDate', generatedEvent.startDate);
    if (generatedEvent.endDate) setValue('endDate', generatedEvent.endDate);
    if (
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'sport' in generatedEvent &&
      generatedEvent.sport
    ) {
      setValue('sport', generatedEvent.sport);
    }
    if (
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'goalDuration' in generatedEvent
    ) {
      setValue('goalDuration', generatedEvent.goalDuration ?? null);
    }
    if (
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'goalDistance' in generatedEvent
    ) {
      setValue('goalDistance', generatedEvent.goalDistance ?? null);
    }
    if (
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'goalElevationGain' in generatedEvent
    ) {
      setValue('goalElevationGain', generatedEvent.goalElevationGain ?? null);
    }
    if (
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'goalRpe' in generatedEvent
    ) {
      setValue('goalRpe', generatedEvent.goalRpe ?? null);
    }
    if (
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'workout' in generatedEvent &&
      generatedEvent.workout &&
      generatedEvent.workout.steps
    ) {
      setWorkoutSteps(generatedEvent.workout.steps);
    } else {
      // Allow creation even without steps
      setWorkoutSteps([]);
    }
  };

  // Handle event modification (for edit mode)
  const handleEventModified = (modifiedEvent: UpdateEventDto) => {
    const isTraining = modifiedEvent.type === EVENT_TYPE.TRAINING;
    const trainingEventData = isTraining
      ? (modifiedEvent as UpdateEventDto & {
          type: EVENT_TYPE.TRAINING;
          sport?: SPORT_TYPE;
          goalDuration?: number | null;
          goalDistance?: number | null;
          goalElevationGain?: number | null;
          goalRpe?: number | null;
          workout?: { steps: CreateWorkoutStepDto[] } | null;
        })
      : null;
    // Update form with modified event data
    if (modifiedEvent.name) setValue('name', modifiedEvent.name);
    if (modifiedEvent.description !== undefined)
      setValue('description', modifiedEvent.description);
    if (modifiedEvent.startDate) setValue('startDate', modifiedEvent.startDate);
    if (modifiedEvent.endDate) setValue('endDate', modifiedEvent.endDate);
    if (isTraining && trainingEventData?.sport) {
      setValue('sport', trainingEventData.sport);
    }
    if (
      isTraining &&
      trainingEventData &&
      'goalDuration' in trainingEventData
    ) {
      setValue('goalDuration', trainingEventData.goalDuration ?? null);
    }
    if (
      isTraining &&
      trainingEventData &&
      'goalDistance' in trainingEventData
    ) {
      setValue('goalDistance', trainingEventData.goalDistance ?? null);
    }
    if (
      isTraining &&
      trainingEventData &&
      'goalElevationGain' in trainingEventData
    ) {
      setValue(
        'goalElevationGain',
        trainingEventData.goalElevationGain ?? null,
      );
    }
    if (isTraining && trainingEventData && 'goalRpe' in trainingEventData) {
      setValue('goalRpe', trainingEventData.goalRpe ?? null);
    }
    // Always update workout steps for training events, even if empty
    // This ensures that AI modifications (including removal of steps) are reflected
    if (isTraining && trainingEventData) {
      if (
        trainingEventData.workout &&
        trainingEventData.workout.steps &&
        trainingEventData.workout.steps.length > 0
      ) {
        setWorkoutSteps(trainingEventData.workout.steps);
      } else {
        // Clear steps if workout is empty or doesn't exist
        setWorkoutSteps([]);
      }
    }
  };

  if (
    (create &&
      (!('date' in rest) || !rest.date || !('type' in rest) || !rest.type)) ||
    (edit && (!('event' in rest) || !rest.event))
  ) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-center gap-2">
            <div className="flex items-center gap-2 grow">
              {edit && 'isTemplate' in rest && rest.isTemplate
                ? m.edit_template()
                : edit
                  ? m.edit()
                  : m.plan()}{' '}
              {edit && 'isTemplate' in rest && rest.isTemplate ? '' : m.a()}{' '}
              {eventTypeLabelMap[type as keyof typeof eventTypeLabelMap]}
            </div>
            {type === EVENT_TYPE.TRAINING && (
              <div className="flex items-center gap-2 pr-4 -translate-y-4">
                <Button
                  onClick={() => setAiDialogOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isCreateMode ? m.create_with_ai() : m.modify_with_ai()}
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <FormProvider
          methods={methods}
          onSubmit={onSubmit(handleSubmit)}
          className="space-y-6 pt-3"
        >
          <EventFormFields
            type={type}
            hasStepsWithDuration={hasStepsWithDuration}
            startDateValue={startDateValue}
            goalDistanceValue={goalDistanceValue}
            goalDurationValue={goalDurationValue}
            setValue={setValue}
            isTemplate={edit && 'isTemplate' in rest && rest.isTemplate}
          />

          <WorkoutSection
            props={rest}
            type={type}
            workoutSteps={workoutSteps}
            setWorkoutSteps={setWorkoutSteps}
            sportValue={sportValue}
          />

          <div className="flex items-center gap-4">
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {edit ? m.edit() : m.create()} {m.the()}
              {eventTypeLabelMap[type as keyof typeof eventTypeLabelMap]}
            </Button>
            {create && (
              <RHFCheckbox
                name="saveAsTemplate"
                label={m.save_event_as_template()}
              />
            )}
          </div>
        </FormProvider>
      </DialogContent>
      {currentEventData && (
        <AIModifyEventDialog
          open={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          eventData={currentEventData}
          date={create ? rest.date : undefined}
          isCreateMode={isCreateMode}
          onEventGenerated={handleEventGenerated}
          onEventModified={handleEventModified}
        />
      )}
    </Dialog>
  );
}
