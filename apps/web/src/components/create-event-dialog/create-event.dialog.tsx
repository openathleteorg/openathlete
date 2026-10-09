import { useAiAccessQuery } from '@/api/ai-settings';
import { useGetMyAthleteQuery } from '@/api/athlete';
import {
  useDeleteEventMutation,
  useDeleteEventSeriesMutation,
} from '@/api/event';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AiTask } from '@openathlete/shared';
import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  Event,
  SPORT_TYPE,
  UpdateEventDto,
} from '@openathlete/shared';
import { EVENT_TYPE } from '@openathlete/shared';

import { AiSetupDialog } from '../ai-settings';
import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import {
  type SeriesScope,
  SeriesScopeDialog,
} from '../calendar/series-scope-dialog';
import { isPlannedEvent } from '../calendar/utils/compliance';
import { restoreDeleted } from '../calendar/utils/restore-deleted';
import { undoable } from '../calendar/utils/undo';
import { ConfirmAction } from '../confirm-action/confirm-action';
import { FormProvider } from '../hook-form';
import { RHFCheckbox } from '../hook-form/rhf-checkbox';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AIModifyEventDialog } from './components/ai-modify-event-dialog';
import { EventFormFields } from './components/event-form-fields';
import { RepeatFields } from './components/repeat-fields';
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
      /** After the event is deleted from the dialog */
      onDeleted?: () => void;
    };

/** Whole sentences: "Edit" + "a" + type reads wrong in every language */
const EDIT_TITLES: Record<EVENT_TYPE, () => string> = {
  [EVENT_TYPE.TRAINING]: () => m.event_dialog_edit_training(),
  [EVENT_TYPE.COMPETITION]: () => m.event_dialog_edit_competition(),
  [EVENT_TYPE.NOTE]: () => m.event_dialog_edit_note(),
  [EVENT_TYPE.ACTIVITY]: () => m.event_dialog_edit_activity(),
};
const PLAN_TITLES: Record<EVENT_TYPE, () => string> = {
  [EVENT_TYPE.TRAINING]: () => m.event_dialog_plan_training(),
  [EVENT_TYPE.COMPETITION]: () => m.event_dialog_plan_competition(),
  [EVENT_TYPE.NOTE]: () => m.event_dialog_plan_note(),
  [EVENT_TYPE.ACTIVITY]: () => m.event_dialog_plan_activity(),
};

export function CreateEventDialog({ open, onClose, ...rest }: P) {
  const { athleteId, events: calendarEvents } = useCalendarContext();
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
      // Calculate endDate from startDate + 1 hour
      const calculatedStartDate = getStartDate(rest.date);
      return getEndDate(rest.date, calculatedStartDate);
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

  // A repeated session asks whether the change covers the following ones
  const [scopeRequest, setScopeRequest] = useState<{
    action: 'edit' | 'delete';
    resolve: (scope: SeriesScope | null) => void;
  } | null>(null);
  const chooseSeriesScope = useCallback(
    (action: 'edit' | 'delete' = 'edit') =>
      new Promise<SeriesScope | null>((resolve) =>
        setScopeRequest({ action, resolve }),
      ),
    [],
  );
  const answerScope = (scope: SeriesScope | null) => {
    scopeRequest?.resolve(scope);
    setScopeRequest(null);
  };

  // Handle form submission
  const { onSubmit, isSubmitting } = useEventFormSubmission(
    rest,
    athleteId ?? 0,
    workoutSteps,
    onClose,
    chooseSeriesScope,
  );

  // Watch form values for UI
  const startDateValue = watch('startDate');
  const goalDistanceValue = watch('goalDistance');
  const goalDurationValue = watch('goalDuration');
  const sportValue = watch('sport');

  // Calculate endDate automatically when startDate or goalDuration changes
  useEffect(() => {
    if (
      startDateValue &&
      !hasStepsWithDuration &&
      (type === EVENT_TYPE.TRAINING || type === EVENT_TYPE.COMPETITION)
    ) {
      const duration = goalDurationValue || 3600; // Default 1 hour
      const start = new Date(startDateValue);
      const end = new Date(start);
      end.setSeconds(start.getSeconds() + duration);
      setValue('endDate', end, { shouldValidate: false });
    }
  }, [startDateValue, goalDurationValue, hasStepsWithDuration, type, setValue]);

  const isTemplate = edit && 'isTemplate' in rest && !!rest.isTemplate;
  const { data: myAthlete } = useGetMyAthleteQuery();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const deletedEvent = 'event' in rest ? rest.event : undefined;
  // Hook options, not mutate callbacks: the dialog closes on success
  const deleteEventMutation = useDeleteEventMutation({
    onSuccess: () => {
      // A plan can come back; an activity comes from its device
      if (deletedEvent && deletedEvent.type !== EVENT_TYPE.ACTIVITY) {
        undoable(m.calendar_items_deleted({ count: 1 }), () =>
          restoreDeleted(queryClient, [deletedEvent]),
        );
      }
    },
    onError: () => toast.error(m.failed_to_delete_event()),
  });
  const deleteSeriesMutation = useDeleteEventSeriesMutation({
    onSuccess: ({ deleted }) => {
      if (!deletedEvent) return;
      // What the API deleted: this occurrence and the following ones to do
      const occurrences = calendarEvents.filter(
        (other) =>
          other.seriesId === deletedEvent.seriesId &&
          other.startDate >= deletedEvent.startDate &&
          (other.eventId === deletedEvent.eventId ||
            !isPlannedEvent(other) ||
            !other.relatedActivity),
      );
      undoable(m.calendar_items_deleted({ count: deleted }), () =>
        restoreDeleted(queryClient, occurrences),
      );
    },
    onError: () => toast.error(m.failed_to_delete_event()),
  });
  const isSeriesEvent = edit && 'event' in rest && !!rest.event?.seriesId;
  const deleteEvent = async () => {
    if (!('event' in rest) || !rest.event) return;
    const { eventId } = rest.event;
    const onDeleted = rest.onDeleted;
    const done = () => {
      setConfirmDelete(false);
      onClose();
      onDeleted?.();
    };
    const scope = isSeriesEvent ? await chooseSeriesScope('delete') : 'single';
    if (!scope) return;
    if (scope === 'following') {
      deleteSeriesMutation.mutate(eventId, { onSuccess: done });
    } else {
      deleteEventMutation.mutate(eventId, { onSuccess: done });
    }
  };

  // AI modification/generation dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiSetupOpen, setAiSetupOpen] = useState(false);

  // Determine if we're in create mode (empty form)
  const formName = watch('name');
  const isCreateMode = !formName || formName.trim() === '';

  // AI generates an empty event, or modifies a filled one
  const { data: aiAccess } = useAiAccessQuery();
  const hasAIAccess =
    aiAccess?.tasks[
      isCreateMode ? AiTask.EVENT_GENERATION : AiTask.EVENT_MODIFICATION
    ].available ?? false;

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
      <DialogContent
        mobileFullscreen
        className="sm:max-w-4xl sm:max-h-[90vh] max-h-[100vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-2">
            <div className="flex items-center gap-2 grow text-sm md:text-base">
              {isTemplate
                ? m.edit_template()
                : edit
                  ? EDIT_TITLES[type]()
                  : PLAN_TITLES[type]()}
            </div>
            {type === EVENT_TYPE.TRAINING && (
              <div className="flex items-center gap-2 md:pr-4 md:-translate-y-4 w-full md:w-auto">
                <Button
                  onClick={() => {
                    if (hasAIAccess) {
                      setAiDialogOpen(true);
                    } else {
                      setAiSetupOpen(true);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-none text-xs md:text-sm"
                >
                  <SparklesIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">
                    {isCreateMode ? m.create_with_ai() : m.modify_with_ai()}
                  </span>
                  <span className="sm:hidden">{m.ui_ai()} </span>
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <FormProvider
          methods={methods}
          onSubmit={onSubmit(handleSubmit)}
          className="space-y-4 md:space-y-6 pt-3"
        >
          <EventFormFields
            type={type}
            logging={create && type === EVENT_TYPE.ACTIVITY}
            hasStepsWithDuration={hasStepsWithDuration}
            startDateValue={startDateValue}
            endDateValue={watch('endDate')}
            canChooseEquipment={
              edit &&
              'event' in rest &&
              !!myAthlete &&
              rest.event?.athleteId === myAthlete.athleteId
            }
            goalDistanceValue={goalDistanceValue}
            goalDurationValue={goalDurationValue}
            setValue={setValue}
            isTemplate={isTemplate}
          />

          {create && !isTemplate && type !== EVENT_TYPE.ACTIVITY && (
            <RepeatFields startDate={startDateValue} />
          )}

          <WorkoutSection
            props={rest}
            type={type}
            workoutSteps={workoutSteps}
            setWorkoutSteps={setWorkoutSteps}
            sportValue={sportValue}
            athleteId={athleteId ?? undefined}
          />

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {edit ? m.save() : m.create()}
            </Button>
            {edit && !isTemplate && 'event' in rest && rest.event && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                // A repeated session asks its scope instead of a confirmation
                onClick={() =>
                  isSeriesEvent ? void deleteEvent() : setConfirmDelete(true)
                }
                data-event-delete
              >
                <Trash2 className="h-4 w-4" />
                {m.delete_()}
              </Button>
            )}
            {create && type !== EVENT_TYPE.ACTIVITY && (
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
          analyticsSource="event_dialog"
          onEventGenerated={handleEventGenerated}
          onEventModified={handleEventModified}
        />
      )}
      <AiSetupDialog
        open={aiSetupOpen}
        onOpenChange={setAiSetupOpen}
        analyticsSource="event_dialog"
      />
      <SeriesScopeDialog
        open={!!scopeRequest}
        action={scopeRequest?.action ?? 'edit'}
        onChoose={answerScope}
        onCancel={() => answerScope(null)}
      />
      {edit && 'event' in rest && rest.event && (
        <ConfirmAction
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void deleteEvent()}
          title={m.delete_event()}
          message={
            type === EVENT_TYPE.ACTIVITY
              ? m.confirm_delete_activity()
              : m.confirm_delete_event()
          }
          confirmText={m.delete_()}
          isLoading={deleteEventMutation.isPending}
        />
      )}
    </Dialog>
  );
}
