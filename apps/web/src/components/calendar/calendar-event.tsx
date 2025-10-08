import { m } from '@/paraglide/messages';
import {
  useDeleteEventMutation,
  useDuplicateEventMutation,
} from '@/services/event';
import { useCreateEventTemplateMutation } from '@/services/event-template';
import {
  getEventTypeColor,
  getHighSaturatedRpeColor,
  getLowSaturatedRpeColor,
  getSportColor,
} from '@/utils/color';
import { cn } from '@/utils/shadcn';
import { useDraggable } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  EVENT_TYPE,
  Event,
  SPORT_TYPE,
  formatDistance,
  formatDuration,
} from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { SportIcon } from '../sport-icon/sport-icon';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { useCalendarContext } from './hooks/use-calendar-context';
import { COLORED_BY } from './types/filter';

interface P {
  event: Event;
  wrapped?: boolean;
}

function EventSecondLine({ event }: { event: Event }) {
  if (event.type === 'ACTIVITY') {
    if (
      event.sport === SPORT_TYPE.RUNNING ||
      event.sport === SPORT_TYPE.CYCLING ||
      event.sport === SPORT_TYPE.TRAIL_RUNNING ||
      event.sport === SPORT_TYPE.SWIMMING ||
      event.sport === SPORT_TYPE.HIKING
    ) {
      return (
        <div className="flex justify-between w-full">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDuration(event.movingTime)}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDistance(event.distance, 'km')} km
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-between w-full">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDuration(event.movingTime)}
          </div>
        </div>
      );
    }
  }
  if (event.type === 'TRAINING' || event.type === 'COMPETITION') {
    return (
      <div className="flex justify-between w-full">
        {event.goalDuration && (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDuration(event.goalDuration)}
          </div>
        )}
        {event.goalDistance && (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDistance(event.goalDistance, 'km')} km
          </div>
        )}
      </div>
    );
  }
}

export function CalendarEvent({ event, wrapped }: P) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.eventId,
    });
  const {
    openEventDetails,
    editEvent,
    events: allEvents,
    coloredBy,
  } = useCalendarContext();
  const [deleteEventDialog, setDeleteEventDialog] = useState<boolean>(false);
  const deleteEventMutation = useDeleteEventMutation();
  const duplicateEventMutation = useDuplicateEventMutation();
  const createEventTemplateMutation = useCreateEventTemplateMutation({
    onSuccess: () => toast.success('Saved as template successfully'),
  });

  const eventColor = useMemo(() => {
    switch (coloredBy || COLORED_BY.TYPE) {
      case COLORED_BY.TYPE:
        return getEventTypeColor(event.type);
      case COLORED_BY.SPORT:
        const sport = event.type !== EVENT_TYPE.NOTE ? event.sport : null;
        if (sport === null)
          return 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
        return getSportColor(sport);
      case COLORED_BY.RPE:
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
  }, [event, coloredBy]);

  const draggable = event.type !== EVENT_TYPE.ACTIVITY && !wrapped;
  const relatedEvents = allEvents.filter(
    (e) =>
      (e.type === EVENT_TYPE.TRAINING || e.type === EVENT_TYPE.COMPETITION) &&
      e.relatedActivity?.eventId === event.eventId,
  );
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="flex-1 w-full">
          <div
            className={cn(
              'calendar-event rounded-sm cursor-pointer text-left flex flex-col items-start justify-center py-0.5 px-1 overflow-hidden w-full',
              eventColor,
              isDragging ? 'z-50' : '',
              wrapped ? 'border-2' : '',
            )}
            style={{
              transform: draggable
                ? `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`
                : '',
            }}
            {...listeners}
            {...attributes}
            onClick={(e) => {
              openEventDetails(event.eventId);
              e.stopPropagation();
            }}
            ref={draggable ? setNodeRef : undefined}
          >
            <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis px-1">
              {event.type !== EVENT_TYPE.NOTE && (
                <SportIcon sport={event.sport} className="inline-block mr-1" />
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
              {event.name}
            </div>
            <div className="px-1 w-full">
              <EventSecondLine event={event} />
            </div>
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
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={(e) => {
              editEvent(event.eventId);
              e.stopPropagation();
            }}
          >
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
              {m.save_as_template()}
            </ContextMenuItem>
          )}
          {event.type !== EVENT_TYPE.ACTIVITY && (
            <ContextMenuItem
              onClick={(e) => {
                duplicateEventMutation.mutate(event.eventId);
                e.stopPropagation();
              }}
            >
              {m.duplicate()}
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={(e) => {
              setDeleteEventDialog(true);
              e.stopPropagation();
            }}
          >
            {m.delete_()}
          </ContextMenuItem>
        </ContextMenuContent>
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
