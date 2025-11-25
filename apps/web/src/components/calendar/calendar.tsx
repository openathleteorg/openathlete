import { CalendarAPI } from '@/api/calendar/calendar.api';
import { useGetMyCyclesQuery, useUpdateCycleMutation } from '@/api/cycle';
import { useDuplicateEventMutation, useUpdateEventMutation } from '@/api/event';
import { eventKeys } from '@/api/event/event.keys';
import { useWeeklyLoadSummaryQuery } from '@/api/training-load';
import { trainingLoadKeys } from '@/api/training-load/training-load.keys';
import { useCalendarData } from '@/components/calendar/hooks/use-calendar-data';
import { m } from '@/paraglide/messages';
import { CALENDAR_COLORED_BY, getItem, setItem } from '@/utils/local-storage';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CreateEventDto, Cycle, EVENT_TYPE, Event } from '@openathlete/shared';

import { AIGenerateEventDialog } from '../ai-generate-event-dialog/ai-generate-event.dialog';
import { CreateCycleDialog } from '../create-cycle-dialog';
import { CreateEventDialog } from '../create-event-dialog';
import { CreateEventFromTemplateDialog } from '../create-event-from-template-dialog/create-event-from-template.dialog';
import { CalendarBody } from './calendar-body';
import { CalendarEventDetailsDialog } from './calendar-event-details.dialog';
import { CalendarHeader } from './calendar-header';
import { CalendarWeeklyLoadChart } from './calendar-weekly-load-chart';
import { CalendarContext } from './contexts/calendar-context';
import { EventClipboardProvider } from './contexts/event-clipboard-context';
import { CycleDetailsDialog } from './cycle-details.dialog';
import { CalendarContextType, SummaryType } from './types/calendar-context';
import { COLORED_BY } from './types/filter';
import { getWeekEnd, getWeekKey, getWeekStart } from './utils/week';

interface P {
  events?: Event[];
  athleteId?: number;
  allowCreate?: boolean;
  onMonthChange?: (month: Date) => void;
  isLoading?: boolean;
}

export function Calendar({
  events,
  athleteId,
  allowCreate = true,
  onMonthChange,
  isLoading = false,
}: P) {
  const calendarData = useCalendarData({ events });
  const { data: cycles } = useGetMyCyclesQuery(undefined, athleteId);
  const weekRangeStart = calendarData.displayedWeeks[0]?.[0];
  const weekRangeEnd =
    calendarData.displayedWeeks[calendarData.displayedWeeks.length - 1]?.[6];

  const loadRange = useMemo(() => {
    if (!weekRangeStart || !weekRangeEnd) {
      return { start: undefined, end: undefined };
    }

    const start = getWeekStart(weekRangeStart);
    const end = getWeekEnd(weekRangeEnd);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [weekRangeStart, weekRangeEnd]);

  const queryClient = useQueryClient();
  const {
    data: weeklyLoadSummary,
    isPending: weeklyLoadSummaryLoading,
    refetch: refetchWeeklyLoadSummary,
  } = useWeeklyLoadSummaryQuery(
    loadRange.start,
    loadRange.end,
    athleteId,
    Boolean(loadRange.start && loadRange.end),
  );

  // Track events with ongoing load estimations
  const [estimatingEvents, setEstimatingEvents] = useState<Set<number>>(
    new Set(),
  );

  const weeklyLoadSummaryMap = useMemo(() => {
    if (!weeklyLoadSummary) {
      return {};
    }

    return weeklyLoadSummary.reduce(
      (acc, summary) => ({
        ...acc,
        [getWeekKey(summary.weekStart)]: summary,
      }),
      {} as CalendarContextType['weeklyLoadSummary'],
    );
  }, [weeklyLoadSummary]);

  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(calendarData.displayedMonth);
    }
  }, [calendarData.displayedMonth, onMonthChange]);

  // WebSocket connection and event handling
  useEffect(() => {
    if (!athleteId) {
      return;
    }

    let isSubscribed = false;

    const handleConnect = () => {
      // Re-subscribe when reconnected
      if (!isSubscribed) {
        CalendarAPI.subscribe(athleteId);
        isSubscribed = true;
      }
    };

    const handleDisconnect = () => {
      isSubscribed = false;
    };

    // Connect to websocket
    CalendarAPI.connectSocket().catch((error) => {
      console.error('[Calendar] Failed to connect websocket:', error);
    });

    const socket = CalendarAPI.getSocket();

    // Set up connection/disconnection handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Subscribe immediately if already connected
    if (socket.connected) {
      CalendarAPI.subscribe(athleteId);
      isSubscribed = true;
    }

    // Set up event listeners
    const cleanup = CalendarAPI.onEvent((event) => {
      switch (event.type) {
        case 'training_load_estimation_started': {
          setEstimatingEvents((prev) => {
            const next = new Set(prev);
            next.add(event.payload.eventId);
            return next;
          });
          break;
        }
        case 'training_load_estimation_completed': {
          setEstimatingEvents((prev) => {
            const next = new Set(prev);
            next.delete(event.payload.eventId);
            return next;
          });
          // Invalidate and refetch weekly load summary
          queryClient.invalidateQueries({
            queryKey: [trainingLoadKeys.getWeeklyLoadSummary],
          });
          refetchWeeklyLoadSummary();
          break;
        }
        case 'training_load_estimation_failed': {
          setEstimatingEvents((prev) => {
            const next = new Set(prev);
            next.delete(event.payload.eventId);
            return next;
          });
          break;
        }
        case 'activity_processed': {
          // Invalidate events query to refresh the calendar
          queryClient.invalidateQueries({
            queryKey: [eventKeys.getMyEvents],
          });
          // Also invalidate weekly load summary
          queryClient.invalidateQueries({
            queryKey: [trainingLoadKeys.getWeeklyLoadSummary],
          });
          refetchWeeklyLoadSummary();
          break;
        }
        case 'weekly_load_updated': {
          queryClient.invalidateQueries({
            queryKey: [trainingLoadKeys.getWeeklyLoadSummary],
          });
          refetchWeeklyLoadSummary();
          break;
        }
      }
    });

    return () => {
      cleanup();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (isSubscribed) {
        CalendarAPI.unsubscribe(athleteId);
      }
    };
  }, [athleteId, queryClient, refetchWeeklyLoadSummary]);

  const [eventDetailsOpened, setEventDetailsOpened] = useState<
    Event['eventId'] | null
  >(null);
  const [createEventDialog, setCreateEventDialog] = useState<{
    date: Date;
    type: EVENT_TYPE;
    prefilledData?: CreateEventDto;
  } | null>(null);
  const [createEventFromTemplateDialog, setCreateEventFromTemplateDialog] =
    useState<Date | null>(null);
  const [aiGenerateEventDialog, setAIGenerateEventDialog] =
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
  const [coloredBy, setColoredBy] = useState<COLORED_BY | null>(() => {
    const savedValue = getItem(CALENDAR_COLORED_BY);
    return savedValue ? (savedValue as COLORED_BY) : null;
  });
  const updateEventMutation = useUpdateEventMutation();
  const duplicateEventMutation = useDuplicateEventMutation();
  const updateCycleMutation = useUpdateCycleMutation();

  const updateCycleDates = useCallback(
    (cycleId: number, startDate: Date, endDate: Date) => {
      updateCycleMutation.mutate(
        {
          cycleId,
          body: { startDate, endDate },
        },
        {
          onSuccess: () => {
            toast.success(m.cycle_updated_successfully());
          },
          onError: () => {
            toast.error(m.failed_to_update_cycle());
          },
        },
      );
    },
    [updateCycleMutation],
  );

  // Persist coloredBy to localStorage
  useEffect(() => {
    if (coloredBy) {
      setItem(CALENDAR_COLORED_BY, coloredBy);
    } else {
      setItem(CALENDAR_COLORED_BY, '');
    }
  }, [coloredBy]);

  const memoizedValue = useMemo<CalendarContextType>(
    () => ({
      ...calendarData,
      events: calendarData.events.filter(filter),
      cycles: cycles || [],
      createEvent: (date, type) => {
        setCreateEventDialog({ date, type });
      },
      createEventFromTemplate: setCreateEventFromTemplateDialog,
      createEventWithAI: setAIGenerateEventDialog,
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
      weeklyLoadSummary: weeklyLoadSummaryMap,
      weeklyLoadSummaryLoading,
      estimatingEvents,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      calendarData.displayedMonth,
      calendarData.events,
      cycles,
      dragSelection,
      cycleResize,
      filter,
      summaryType,
      coloredBy,
      eventDetailsOpened,
      allowCreate,
      athleteId,
      weeklyLoadSummaryMap,
      weeklyLoadSummaryLoading,
      estimatingEvents,
    ],
  );

  const dndOnDragEnd = async (e: DragEndEvent) => {
    if (!e.over?.id) return;
    const altKey = (e.activatorEvent as PointerEvent).altKey;
    const day = new Date(e.over?.id);
    const eventId = Number(e.active.id);
    const event = events?.find((evt) => evt.eventId === eventId);
    if (!event) return;

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
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
      duplicateEventMutation.mutate({
        eventId: event.eventId,
        body: {
          startDate,
          endDate,
        },
      });
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
      <EventClipboardProvider>
        <CalendarContext.Provider value={memoizedValue}>
          <CalendarHeader />
          <div className="relative">
            <div className={isLoading ? 'opacity-50 transition-opacity' : ''}>
              <DndContext onDragEnd={dndOnDragEnd} sensors={sensors}>
                <CalendarBody />
              </DndContext>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{m.loading()}</p>
                </div>
              </div>
            )}
          </div>
          <CalendarWeeklyLoadChart
            weeks={calendarData.displayedWeeks}
            displayedMonth={calendarData.displayedMonth}
            weeklyLoadSummary={weeklyLoadSummaryMap}
            isLoading={weeklyLoadSummaryLoading}
          />
          <CreateEventDialog
            key={createEventDialog?.date?.toDateString()}
            open={createEventDialog !== null}
            onClose={() => {
              setCreateEventDialog(null);
            }}
            date={createEventDialog?.date}
            type={createEventDialog?.type}
            prefilledData={createEventDialog?.prefilledData}
          />
          <AIGenerateEventDialog
            open={aiGenerateEventDialog !== null}
            onClose={() => {
              setAIGenerateEventDialog(null);
            }}
            date={aiGenerateEventDialog || new Date()}
            onEventGenerated={(event) => {
              setAIGenerateEventDialog(null);
              setCreateEventDialog({
                date: event.startDate,
                type: event.type,
                prefilledData: event,
              });
            }}
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
            key={`create-cycle-${createCycleDialog?.startDate?.toDateString()}`}
            open={createCycleDialog !== null}
            onClose={() => setCreateCycleDialog(null)}
            startDate={createCycleDialog?.startDate}
            endDate={createCycleDialog?.endDate}
          />
          <CreateCycleDialog
            key={`edit-cycle-${editCycleDialog}`}
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
      </EventClipboardProvider>
    </div>
  );
}
