import {
  useDeleteEventMutation,
  useDuplicateEventMutation,
  useUnsetRelatedActivityMutation,
} from '@/api/event';
import { useCreateEventTemplateMutation } from '@/api/event-template';
import { useIsEventValidated } from '@/hooks/use-event-validation';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { AnalyticsEvent } from '@/utils/analytics-events';
import {
  getEventTypeColor,
  getHighSaturatedRpeColor,
  getLowSaturatedRpeColor,
  getSportColor,
} from '@/utils/color';
import { cn } from '@/utils/shadcn';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  ActivityIcon,
  Copy,
  Edit2,
  FileText,
  Trash2,
  Trophy,
  Unlink,
} from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EVENT_TYPE, Event, SPORT_TYPE } from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { SportIcon } from '../sport-icon/sport-icon';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { CalendarEventTooltipWrapper } from './calendar-event-tooltip-wrapper';
import { useBulkWorkoutSelection } from './contexts/bulk-workout-selection-context';
import { useEventClipboard } from './contexts/event-clipboard-context';
import { useEventContextMenu } from './contexts/event-context-menu-context';
import { useCalendarContext } from './hooks/use-calendar-context';
import { COLORED_BY } from './types/filter';
import {
  PlannedEvent,
  complianceStripClass,
  getCompliance,
  isPlannedEvent,
  isShownCompliance,
} from './utils/compliance';
import { complianceLabel } from './utils/compliance-labels';
import { isActivityDrag, linkDropId } from './utils/link-drop';
import {
  formatCompactDuration,
  formatCompactKilometers,
} from './utils/week-summary';

interface P {
  event: Event;
  wrapped?: boolean;
  detailed?: boolean;
}

const DISTANCE_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.SWIMMING,
  SPORT_TYPE.HIKING,
]);

/**
 * Duration and distance, done or planned. They wrap onto two lines when the
 * card is narrow rather than running into each other.
 */
function EventSecondLine({ event }: { event: Event }) {
  let duration: number | null | undefined;
  let distance: number | null | undefined;
  if (event.type === EVENT_TYPE.ACTIVITY) {
    duration = event.movingTime;
    distance = DISTANCE_SPORTS.has(event.sport) ? event.distance : null;
  } else if (isPlannedEvent(event)) {
    duration = event.goalDuration;
    distance = event.goalDistance;
  } else {
    return null;
  }
  if (!duration && !distance) return null;

  return (
    <div className="flex w-full flex-wrap justify-between gap-x-2 text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
      {!!duration && <span>{formatCompactDuration(duration)}</span>}
      {!!distance && (
        <span>{formatCompactKilometers(distance, getLocale())} km</span>
      )}
    </div>
  );
}

export function CalendarEvent({ event, wrapped, detailed = false }: P) {
  const posthog = usePostHog();
  const bulk = useBulkWorkoutSelection();
  const selectable = !!bulk?.selecting && bulk.eligible.has(event.eventId);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    disabled: bulk?.selecting,
    id: event.eventId,
    data: {
      type: 'event',
      event,
    },
  });
  const {
    openEventDetails,
    editEvent,
    events: allEvents,
    coloredBy,
    athleteId,
  } = useCalendarContext();
  const [deleteEventDialog, setDeleteEventDialog] = useState<boolean>(false);
  const deleteEventMutation = useDeleteEventMutation({
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.event_deleted, {
        event_type: event.type,
      });
    },
  });
  const duplicateEventMutation = useDuplicateEventMutation({
    onSuccess: (duplicated) => {
      posthog?.capture(AnalyticsEvent.event_duplicated, {
        event_type: duplicated.type,
      });
    },
  });
  const createEventTemplateMutation = useCreateEventTemplateMutation({
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.event_template_saved, {
        from: 'calendar_menu',
      });
      toast.success(m.template_saved_successfully());
    },
  });
  const unsetRelatedActivityMutation = useUnsetRelatedActivityMutation();
  const unlinkActivity = (sessionId: Event['eventId']) =>
    unsetRelatedActivityMutation.mutate(sessionId, {
      onSuccess: () => toast.success(m.calendar_unlink_done()),
      onError: () => toast.error(m.calendar_link_failed()),
    });
  const isValidated = useIsEventValidated(event, athleteId);
  const { copyEvent } = useEventClipboard();
  const { isAnyContextMenuOpen, setContextMenuOpen } = useEventContextMenu();

  const eventColor = useMemo(() => {
    switch (coloredBy || COLORED_BY.TYPE) {
      case COLORED_BY.TYPE:
        return getEventTypeColor(event.type);
      case COLORED_BY.SPORT: {
        const sport = event.type !== EVENT_TYPE.NOTE ? event.sport : null;
        if (sport === null)
          return 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
        return getSportColor(sport);
      }
      case COLORED_BY.RPE: {
        const rpe =
          event.type === EVENT_TYPE.ACTIVITY
            ? event.rpe
            : event.type === EVENT_TYPE.TRAINING ||
                event.type === EVENT_TYPE.COMPETITION
              ? event.goalRpe
              : null;
        if (rpe === null)
          return 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
        return getLowSaturatedRpeColor(rpe);
      }
    }
  }, [event, coloredBy]);

  // While selecting, the event is not draggable: dnd-kit would still mark it
  // aria-disabled, and with it the selection checkbox inside. Activities are
  // dragged onto their planned session to link them.
  const draggable = !wrapped && !bulk?.selecting;
  // A planned session still waiting for its activity takes one by drop
  const linkTarget =
    isPlannedEvent(event) && !event.relatedActivity && !wrapped;
  const {
    setNodeRef: setDropRef,
    isOver: isLinkOver,
    active: activeDrag,
  } = useDroppable({
    id: linkDropId(event.eventId),
    disabled: !linkTarget,
  });
  const awaitsActivity = linkTarget && isActivityDrag(activeDrag);
  const setCardRef = useCallback(
    (node: HTMLElement | null) => {
      if (draggable) setNodeRef(node);
      setDropRef(node);
    },
    [draggable, setNodeRef, setDropRef],
  );
  const relatedEvents = allEvents.filter(
    (e): e is PlannedEvent =>
      isPlannedEvent(e) && e.relatedActivity?.eventId === event.eventId,
  );
  // A done session shows as its activity, so the activity carries the strip
  const plannedEvent = isPlannedEvent(event) ? event : relatedEvents[0];
  const compliance =
    plannedEvent && !wrapped ? getCompliance(plannedEvent) : undefined;
  const shownCompliance = isShownCompliance(compliance)
    ? compliance
    : undefined;
  return (
    <>
      <ContextMenu
        onOpenChange={(open) => {
          setContextMenuOpen(event.eventId, open);
        }}
      >
        <ContextMenuTrigger className="w-full">
          <CalendarEventTooltipWrapper
            event={event}
            compliance={compliance}
            disabled={isDragging || isAnyContextMenuOpen || bulk?.selecting}
          >
            <div
              className={cn(
                'calendar-event rounded-sm cursor-pointer text-left flex flex-col items-start justify-center py-0.5 px-1 overflow-hidden w-full',
                eventColor,
                wrapped ? 'border-2' : '',
                shownCompliance &&
                  cn(
                    'border-l-4',
                    complianceStripClass[shownCompliance.status],
                  ),
                !isValidated ? 'opacity-60' : '',
                isDragging ? 'opacity-30' : '',
                awaitsActivity &&
                  'outline-2 outline-offset-1 outline-dashed outline-primary/50 transition-transform',
                awaitsActivity &&
                  isLinkOver &&
                  'scale-[1.03] bg-primary/10 outline-solid outline-primary',
                selectable &&
                  bulk?.selected.has(event.eventId) &&
                  'ring-2 ring-inset ring-primary',
              )}
              ref={setCardRef}
              data-compliance={shownCompliance?.status}
              {...(draggable ? { ...listeners, ...attributes } : {})}
              onClick={(e) => {
                if (bulk?.selecting) {
                  if (selectable) bulk.toggle(event.eventId);
                } else openEventDetails(event.eventId);
                e.stopPropagation();
              }}
              onMouseEnter={(e) => {
                if (wrapped) {
                  e.stopPropagation();
                }
              }}
              onMouseLeave={(e) => {
                if (wrapped) {
                  e.stopPropagation();
                }
              }}
            >
              {selectable && (
                <label
                  className="flex items-center min-h-11 gap-2 px-1 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={bulk.selected.has(event.eventId)}
                    disabled={bulk.busy}
                    onChange={() => bulk.toggle(event.eventId)}
                    aria-label={m.bulk_workouts_toggle({ name: event.name })}
                  />
                  {m.bulk_workouts_toggle({ name: event.name })}
                </label>
              )}
              <div
                className={cn(
                  'text-sm font-medium px-1 break-words',
                  // Two lines in narrow day cells rather than a few letters
                  detailed ? 'whitespace-normal' : 'line-clamp-2',
                )}
              >
                {event.type !== EVENT_TYPE.NOTE && (
                  <SportIcon
                    sport={event.sport}
                    className="inline-block mr-1"
                  />
                )}
                {event.type === EVENT_TYPE.ACTIVITY && event.isRace && (
                  <Trophy
                    className="inline-block h-3.5 w-3.5 mr-1 text-amber-500"
                    aria-label={m.activity_race_badge()}
                  />
                )}
                {event.type === EVENT_TYPE.ACTIVITY && event.rpe !== null && (
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full inline-block mr-1',
                      getHighSaturatedRpeColor(event.rpe),
                    )}
                  />
                )}
                {(event.type === EVENT_TYPE.TRAINING ||
                  event.type === EVENT_TYPE.COMPETITION) &&
                  event.goalRpe !== null && (
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full inline-block mr-1',
                        getHighSaturatedRpeColor(event.goalRpe),
                      )}
                    />
                  )}
                {event.type === EVENT_TYPE.TRAINING &&
                  'workout' in event &&
                  event.workout &&
                  event.workout.steps.length > 0 && (
                    <ActivityIcon className="inline-block w-3 h-3 mr-1 text-gray-600 dark:text-gray-400" />
                  )}
                {event.name}
              </div>
              <div className="px-1 w-full">
                <EventSecondLine event={event} />
              </div>
              {shownCompliance && (
                <span className="sr-only">
                  {complianceLabel[shownCompliance.status]()}
                </span>
              )}
              {relatedEvents.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 w-full mb-0.5">
                  {relatedEvents.map((relatedEvent) => (
                    <CalendarEvent
                      key={relatedEvent.eventId}
                      event={relatedEvent}
                      wrapped
                    />
                  ))}
                </div>
              )}
            </div>
          </CalendarEventTooltipWrapper>
        </ContextMenuTrigger>
        {!bulk?.selecting && (
          <ContextMenuContent>
            <ContextMenuItem
              onClick={(e) => {
                editEvent(event.eventId);
                e.stopPropagation();
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {m.edit()}
            </ContextMenuItem>
            {event.type === EVENT_TYPE.TRAINING && (
              <ContextMenuItem
                onClick={(e) => {
                  createEventTemplateMutation.mutate({
                    eventId: event.eventId,
                  });
                  e.stopPropagation();
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                {m.save_as_template()}
              </ContextMenuItem>
            )}
            {isPlannedEvent(event) && event.relatedActivity && (
              <ContextMenuItem
                onClick={(e) => {
                  unlinkActivity(event.eventId);
                  e.stopPropagation();
                }}
              >
                <Unlink className="w-4 h-4 mr-2" />
                {m.calendar_unlink_activity()}
              </ContextMenuItem>
            )}
            {relatedEvents.map((related) => (
              <ContextMenuItem
                key={related.eventId}
                onClick={(e) => {
                  unlinkActivity(related.eventId);
                  e.stopPropagation();
                }}
              >
                <Unlink className="w-4 h-4 mr-2" />
                {m.calendar_unlink_from({ name: related.name })}
              </ContextMenuItem>
            ))}
            {event.type !== EVENT_TYPE.ACTIVITY && (
              <>
                <ContextMenuItem
                  onClick={(e) => {
                    duplicateEventMutation.mutate({ eventId: event.eventId });
                    e.stopPropagation();
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {m.duplicate()}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={(e) => {
                    copyEvent(event);
                    e.stopPropagation();
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {m.copy()}
                </ContextMenuItem>
              </>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={(e) => {
                setDeleteEventDialog(true);
                e.stopPropagation();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {m.delete_()}
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
      <ConfirmAction
        open={deleteEventDialog}
        onClose={() => setDeleteEventDialog(false)}
        onConfirm={() => {
          deleteEventMutation.mutate(event.eventId);
          setDeleteEventDialog(false);
        }}
        title={m.delete_event()}
        message={m.confirm_delete_event()}
        isLoading={deleteEventMutation.isPending}
      />
    </>
  );
}
