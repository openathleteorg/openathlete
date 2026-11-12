import { useAiAccessQuery } from '@/api/ai-settings';
import { useGetMyAthleteQuery } from '@/api/athlete';
import {
  useDeleteEventMutation,
  useDeleteEventSeriesMutation,
} from '@/api/event';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core/sport-type.label-map';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { suggestSessionName } from '../session-builder/session-name';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AIModifyEventDialog } from './components/ai-modify-event-dialog';
import { EventFormFields } from './components/event-form-fields';
import { RepeatFields } from './components/repeat-fields';
import {
  SessionTitleField,
  SportChips,
  TrainingDetails,
} from './components/training-fields';
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
import { plannedEndDate } from './utils/planned-duration';

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

  const planned =
    type === EVENT_TYPE.TRAINING || type === EVENT_TYPE.COMPETITION;

  // Calculate dates
  const startDate = useMemo(() => {
    if (create) {
      return getStartDate(rest.date, planned);
    } else if (edit) {
      return rest.event?.startDate;
    }
  }, [create, edit, rest, planned]);

  const endDate = useMemo(() => {
    if (create) {
      // Calculate endDate from startDate + 1 hour
      const calculatedStartDate = getStartDate(rest.date, planned);
      return getEndDate(rest.date, calculatedStartDate);
    } else if (edit) {
      return rest.event?.endDate;
    }
  }, [create, edit, rest, planned]);

  // Initialize form
  const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getFormDefaultValues(rest, startDate, endDate),
  });

  const { handleSubmit, setValue, getValues, watch } = methods;

  // Manage workout steps
  const { workoutSteps, setWorkoutSteps } = useWorkoutSteps(rest);

  // Watch form values for UI
  const startDateValue = watch('startDate');
  const goalDistanceValue = watch('goalDistance');
  const goalDurationValue = watch('goalDuration');
  const sportValue = watch('sport');

  const isTemplate = edit && 'isTemplate' in rest && !!rest.isTemplate;
  // Zone targets are ids of the session athlete's zones: the event's when
  // editing, the calendar's when creating. A template has no athlete: the
  // signed-in user's zones (remapped when it is applied to an athlete).
  const workoutAthleteId = isTemplate
    ? null
    : edit && 'event' in rest && rest.event
      ? (rest.event.athleteId ?? null)
      : (athleteId ?? null);

  // The planned duration follows the workout until the coach sets it
  const {
    calculatedDuration,
    durationSetByHand,
    setDurationByHand,
    followWorkout,
    adoptStepsDuration,
  } = useWorkoutDuration(
    workoutSteps,
    sportValue,
    getValues,
    setValue,
    workoutAthleteId,
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

  // The session ends its planned duration after it starts, however set
  useEffect(() => {
    if (
      startDateValue &&
      (type === EVENT_TYPE.TRAINING || type === EVENT_TYPE.COMPETITION)
    ) {
      setValue('endDate', plannedEndDate(startDateValue, goalDurationValue), {
        shouldValidate: false,
      });
    }
  }, [startDateValue, goalDurationValue, type, setValue]);

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

  // The AI creates an empty session and modifies a written one; a name
  // the builder suggested does not make it written
  const formName = watch('name');
  const isCreateMode =
    !formName ||
    formName.trim() === '' ||
    (create && workoutSteps.length === 0);

  // AI generates an empty event, or modifies a filled one, once the user
  // allowed their data to be sent to it
  const { data: aiAccess } = useAiAccessQuery();
  const hasAIAccess = Boolean(
    aiAccess?.tasks[
      isCreateMode ? AiTask.EVENT_GENERATION : AiTask.EVENT_MODIFICATION
    ].available && aiAccess.dataSharingConsent,
  );

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
    const generatedSteps =
      generatedEvent.type === EVENT_TYPE.TRAINING &&
      'workout' in generatedEvent &&
      generatedEvent.workout?.steps
        ? generatedEvent.workout.steps
        : // Allow creation even without steps
          [];
    setWorkoutSteps(generatedSteps);
    // A total the coach stated ("45' in all") wins over the steps' estimate
    if (generatedEvent.type === EVENT_TYPE.TRAINING) {
      adoptStepsDuration(
        generatedSteps,
        generatedEvent.goalDuration,
        generatedEvent.sport,
      );
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
      // Clear steps if workout is empty or doesn't exist
      const modifiedSteps = trainingEventData.workout?.steps ?? [];
      setWorkoutSteps(modifiedSteps);
      // An unchanged duration keeps its mode: one that followed the old
      // steps follows the new ones
      if (
        'goalDuration' in trainingEventData &&
        (trainingEventData.goalDuration ?? null) !==
          (getValues('goalDuration') ?? null)
      ) {
        adoptStepsDuration(
          modifiedSteps,
          trainingEventData.goalDuration,
          trainingEventData.sport,
        );
      }
    }
  };

  // Until the coach names it, the session takes the name of its content
  const nameSuggestion = useMemo(
    () =>
      sportValue
        ? suggestSessionName(
            workoutSteps,
            sportTypeLabelMap[sportValue],
            calculatedDuration,
          )
        : '',
    [workoutSteps, sportValue, calculatedDuration],
  );
  const lastSuggestion = useRef('');
  useEffect(() => {
    if (type !== EVENT_TYPE.TRAINING) return;
    const current = getValues('name') ?? '';
    if (current === '' || current === lastSuggestion.current) {
      setValue('name', nameSuggestion, { shouldValidate: false });
    }
    lastSuggestion.current = nameSuggestion;
  }, [nameSuggestion, type, getValues, setValue]);
  const hasGoals = Boolean(
    goalDistanceValue ||
    watch('goalElevationGain') ||
    watch('goalRpe') ||
    durationSetByHand,
  );

  if (
    (create &&
      (!('date' in rest) || !rest.date || !('type' in rest) || !rest.type)) ||
    (edit && (!('event' in rest) || !rest.event))
  ) {
    return null;
  }

  const aiButton = type === EVENT_TYPE.TRAINING && (
    <Button
      type="button"
      onClick={() => {
        if (hasAIAccess) {
          setAiDialogOpen(true);
        } else {
          setAiSetupOpen(true);
        }
      }}
      variant="outline"
      size="sm"
      className="text-xs md:text-sm"
    >
      <SparklesIcon className="w-3 h-3 md:w-4 md:h-4" />
      <span className="hidden sm:inline">
        {isCreateMode ? m.create_with_ai() : m.modify_with_ai()}
      </span>
      <span className="sm:hidden">{m.ui_ai()} </span>
    </Button>
  );

  const actions = (
    <div className="flex flex-col items-stretch gap-3 max-md:sticky max-md:-bottom-4 max-md:z-10 max-md:-mx-4 max-md:border-t max-md:bg-background max-md:px-4 max-md:pt-3 max-md:pb-[calc(0.75rem+var(--safe-bottom))]">
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          className="flex-1 max-md:min-h-12 max-md:text-base"
          isLoading={isSubmitting}
          data-event-submit
        >
          {edit ? m.save() : m.create()}
        </Button>
        {edit && !isTemplate && 'event' in rest && rest.event && (
          <Button
            type="button"
            variant="outline"
            className="text-destructive max-md:min-h-12"
            // A repeated session asks its scope instead of a confirmation
            onClick={() =>
              isSeriesEvent ? void deleteEvent() : setConfirmDelete(true)
            }
            data-event-delete
          >
            <Trash2 className="h-4 w-4" />
            <span className={cn(type === EVENT_TYPE.TRAINING && 'sr-only')}>
              {m.delete_()}
            </span>
          </Button>
        )}
      </div>
      {create && type !== EVENT_TYPE.ACTIVITY && (
        <RHFCheckbox name="saveAsTemplate" label={m.save_event_as_template()} />
      )}
    </div>
  );

  const title = isTemplate
    ? m.edit_template()
    : edit
      ? EDIT_TITLES[type]()
      : PLAN_TITLES[type]();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {type === EVENT_TYPE.TRAINING ? (
        // A session is its workout: the builder takes the room, the rest
        // goes to the side
        <DialogContent
          mobileFullscreen
          className="grid-cols-[minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)] md:h-[min(94vh,1040px)] md:gap-0 md:overflow-hidden md:p-0 sm:max-w-6xl"
          data-session-composer
        >
          <DialogHeader className="md:border-b md:px-6 md:py-3">
            <DialogTitle className="flex items-center gap-3 pr-8 text-sm font-medium text-muted-foreground md:pr-10">
              <span className="grow">{title}</span>
              {aiButton}
            </DialogTitle>
          </DialogHeader>
          <FormProvider
            methods={methods}
            onSubmit={onSubmit(handleSubmit)}
            className="min-w-0 md:grid md:min-h-0 md:grid-cols-[minmax(0,1fr)_340px]"
          >
            <div className="min-w-0 space-y-4 md:overflow-y-auto md:px-6 md:py-5">
              <SessionTitleField suggestion={nameSuggestion} />
              <SportChips />
              <WorkoutSection
                type={type}
                workoutSteps={workoutSteps}
                setWorkoutSteps={setWorkoutSteps}
                sportValue={sportValue}
                athleteId={workoutAthleteId}
              />
            </div>
            <aside className="mt-6 space-y-5 md:mt-0 md:flex md:flex-col md:overflow-y-auto md:border-l md:bg-muted/30 md:p-5">
              <TrainingDetails
                isTemplate={isTemplate}
                workoutDuration={calculatedDuration}
                durationSetByHand={durationSetByHand}
                onDurationEdited={setDurationByHand}
                onFollowWorkout={followWorkout}
                hasGoals={hasGoals}
              />
              {create && !isTemplate && (
                <RepeatFields startDate={startDateValue} />
              )}
              <div className="md:mt-auto">{actions}</div>
            </aside>
          </FormProvider>
        </DialogContent>
      ) : (
        <DialogContent
          mobileFullscreen
          className="sm:max-w-4xl sm:max-h-[90vh] max-h-[100vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-2">
              <div className="flex items-center gap-2 grow text-sm md:text-base">
                {title}
              </div>
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
              workoutDuration={calculatedDuration}
              durationSetByHand={durationSetByHand}
              onDurationEdited={setDurationByHand}
              onFollowWorkout={followWorkout}
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
            {actions}
          </FormProvider>
        </DialogContent>
      )}
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
