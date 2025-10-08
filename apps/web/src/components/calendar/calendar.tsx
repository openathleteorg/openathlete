import { useCalendarData } from '@/components/calendar/hooks/use-calendar-data';
import { useGetMyCyclesQuery, useUpdateCycleMutation } from '@/services/cycle';
import {
  useDuplicateEventMutation,
  useUpdateEventMutation,
} from '@/services/event';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Cycle, EVENT_TYPE, Event } from '@openathlete/shared';

import { CreateCycleDialog } from '../create-cycle-dialog/create-cycle.dialog';
import { CreateEventDialog } from '../create-event-dialog/create-event.dialog';
import { CreateEventFromTemplateDialog } from '../create-event-from-template-dialog/create-event-from-template.dialog';
import { CalendarBody } from './calendar-body';
import { CalendarEventDetailsDialog } from './calendar-event-details.dialog';
import { CalendarHeader } from './calendar-header';
import { CalendarContext } from './contexts/calendar-context';
import { CycleDetailsDialog } from './cycle-details.dialog';
import { CalendarContextType, SummaryType } from './types/calendar-context';
import { COLORED_BY } from './types/filter';

interface P {
  events?: Event[];
  athleteId?: number;
  allowCreate?: boolean;
}

export function Calendar({ events, athleteId, allowCreate = true }: P) {
  const calendarData = useCalendarData({ events });
  const { data: cycles } = useGetMyCyclesQuery(undefined, athleteId);
  const [eventDetailsOpened, setEventDetailsOpened] = useState<
    Event['eventId'] | null
  >(null);
  const [createEventDialog, setCreateEventDialog] = useState<{
    date: Date;
    type: EVENT_TYPE;
  } | null>(null);
  const [createEventFromTemplateDialog, setCreateEventFromTemplateDialog] =
    useState<Date | null>(null);
  const [editEventDialog, setEditEventDialog] = useState<
    Event['eventId'] | null
  >(null);
  const [createCycleDialog, setCreateCycleDialog] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);
  const [editCycleDialog, setEditCycleDialog] = useState<
    Cycle['cycleId'] | null
  >(null);
  const [viewCycleDialog, setViewCycleDialog] = useState<
    Cycle['cycleId'] | null
  >(null);
  const [dragSelection, setDragSelection] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);
  const [cycleResize, setCycleResize] = useState<{
    cycleId: number;
    edge: 'start' | 'end';
    originalStart: Date;
    originalEnd: Date;
    currentStart: Date;
    currentEnd: Date;
  } | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('planned-done');
  const [filter, setFilter] = useState<(event: Event) => boolean>(
    () => () => true,
  );
  const [coloredBy, setColoredBy] = useState<COLORED_BY | null>(null);
  const updateEventMutation = useUpdateEventMutation();
  const duplicateEventMutation = useDuplicateEventMutation();
  const updateCycleMutation = useUpdateCycleMutation();

  const updateCycleDates = (
    cycleId: number,
    startDate: Date,
    endDate: Date,
  ) => {
    updateCycleMutation.mutate(
      {
        cycleId,
        body: { startDate, endDate },
      },
      {
        onSuccess: () => {
          toast.success('Cycle updated successfully');
        },
        onError: () => {
          toast.error('Failed to update cycle');
        },
      },
    );
  };

  const memoizedValue = useMemo<CalendarContextType>(
    () => ({
      ...calendarData,
      events: calendarData.events.filter(filter),
      cycles: cycles || [],
      createEvent: (date, type) => {
        setCreateEventDialog({ date, type });
      },
      createEventFromTemplate: setCreateEventFromTemplateDialog,
      openEventDetails: setEventDetailsOpened,
      eventDetailsOpened,
      editEvent: (eventId) => setEditEventDialog(eventId),
      createCycle: (startDate, endDate) => {
        setCreateCycleDialog({ startDate, endDate });
      },
      editCycle: (cycleId) => setEditCycleDialog(cycleId),
      viewCycle: (cycleId) => setViewCycleDialog(cycleId),
      updateCycleDates,
      dragSelection,
      setDragSelection,
      cycleResize,
      setCycleResize,
      summaryType,
      setSummaryType,
      athleteId,
      allowCreate,
      filter,
      setFilter,
      coloredBy,
      setColoredBy,
    }),
    [
      calendarData.displayedMonth,
      calendarData.events,
      cycles,
      dragSelection,
      cycleResize,
      filter,
    ],
  );

  const dndOnDragEnd = async (e: DragEndEvent) => {
    if (!e.over?.id) return;
    const altKey = (e.activatorEvent as PointerEvent).altKey;
    const day = new Date(e.over?.id);
    const eventId = Number(e.active.id);
    const event = events?.find((evt) => evt.eventId === eventId);
    if (!event) return;

    const startDate = event.startDate;
    const endDate = event.endDate;
    startDate.setDate(day.getDate());
    startDate.setMonth(day.getMonth());
    startDate.setFullYear(day.getFullYear());
    endDate.setDate(day.getDate());
    endDate.setMonth(day.getMonth());
    endDate.setFullYear(day.getFullYear());

    if (!altKey) {
      updateEventMutation.mutate({
        eventId: event.eventId,
        body: {
          startDate,
          endDate,
        },
      });
    } else {
      const newEvent = await duplicateEventMutation.mutateAsync(event.eventId);
      if (newEvent) {
        updateEventMutation.mutate({
          eventId: newEvent.eventId,
          body: {
            startDate,
            endDate,
          },
        });
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Handle global mouse up to end drag selection and cycle resize
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragSelection) {
        setDragSelection(null);
      }
      if (cycleResize) {
        // Save the cycle resize changes to the database
        if (
          cycleResize.currentStart.getTime() !==
            cycleResize.originalStart.getTime() ||
          cycleResize.currentEnd.getTime() !== cycleResize.originalEnd.getTime()
        ) {
          updateCycleDates(
            cycleResize.cycleId,
            cycleResize.currentStart,
            cycleResize.currentEnd,
          );
        }
        setCycleResize(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dragSelection) {
          setDragSelection(null);
        }
        if (cycleResize) {
          // Cancel resize without saving
          setCycleResize(null);
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [dragSelection, cycleResize, updateCycleDates]);

  return (
    <div className="flex flex-col gap-3">
      <CalendarContext.Provider value={memoizedValue}>
        <CalendarHeader />
        <DndContext onDragEnd={dndOnDragEnd} sensors={sensors}>
          <CalendarBody />
        </DndContext>
        <CreateEventDialog
          key={createEventDialog?.date?.toDateString()}
          open={createEventDialog !== null}
          onClose={() => setCreateEventDialog(null)}
          date={createEventDialog?.date}
          type={createEventDialog?.type}
        />
        <CreateEventDialog
          key={editEventDialog}
          open={editEventDialog !== null}
          onClose={() => setEditEventDialog(null)}
          event={events?.find((event) => event.eventId === editEventDialog)}
        />
        <CalendarEventDetailsDialog
          open={eventDetailsOpened !== null}
          onClose={() => setEventDetailsOpened(null)}
          event={events?.find((e) => e.eventId === eventDetailsOpened)}
          onEditEvent={() => {
            setEditEventDialog(eventDetailsOpened);
            setEventDetailsOpened(null);
          }}
        />
        <CreateEventFromTemplateDialog
          open={createEventFromTemplateDialog !== null}
          onClose={() => setCreateEventFromTemplateDialog(null)}
          date={createEventFromTemplateDialog || undefined}
        />
        <CreateCycleDialog
          key={createCycleDialog?.startDate?.toDateString()}
          open={createCycleDialog !== null}
          onClose={() => setCreateCycleDialog(null)}
          startDate={createCycleDialog?.startDate}
          endDate={createCycleDialog?.endDate}
        />
        <CreateCycleDialog
          key={editCycleDialog}
          open={editCycleDialog !== null}
          onClose={() => setEditCycleDialog(null)}
          cycle={(cycles || []).find(
            (cycle) => cycle.cycleId === editCycleDialog,
          )}
        />
        <CycleDetailsDialog
          open={viewCycleDialog !== null}
          onClose={() => setViewCycleDialog(null)}
          cycle={(cycles || []).find(
            (cycle) => cycle.cycleId === viewCycleDialog,
          )}
          onEditCycle={(cycleId) => {
            setViewCycleDialog(null);
            setEditCycleDialog(cycleId);
          }}
        />
      </CalendarContext.Provider>
    </div>
  );
}
