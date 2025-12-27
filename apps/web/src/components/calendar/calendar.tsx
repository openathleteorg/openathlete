import { CalendarAPI } from '@/api/calendar/calendar.api';
import { useGetMyCyclesQuery, useUpdateCycleMutation } from '@/api/cycle';
import { cycleKeys } from '@/api/cycle/cycle.keys';
import { useDuplicateEventMutation, useUpdateEventMutation } from '@/api/event';
import { useUseEventTemplateMutation } from '@/api/event-template';
import { eventKeys } from '@/api/event/event.keys';
import { useWeeklyLoadSummaryQuery } from '@/api/training-load';
import { trainingLoadKeys } from '@/api/training-load/training-load.keys';
import { useCalendarData } from '@/components/calendar/hooks/use-calendar-data';
import { Loader } from '@/components/ui/loader';
import { m } from '@/paraglide/messages';
import { CALENDAR_COLORED_BY, getItem, setItem } from '@/utils/local-storage';
import { DragEndEvent } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, startOfMonth } from 'date-fns';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  CreateEventDto,
  Cycle,
  EVENT_TYPE,
  Event,
  EventTemplate,
} from '@openathlete/shared';

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
import { EventContextMenuProvider } from './contexts/event-context-menu-context';
import { useSharedDnd } from './contexts/shared-dnd-context';
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

  const hasScheduledActivitiesWithinSixtyDays = useMemo(() => {
    if (!calendarData.events.length) {
      return false;
    }

    const rangeStart = startOfMonth(calendarData.displayedMonth);
    const rangeEnd = addDays(rangeStart, 60);

    return calendarData.events.some((event) => {
      const eventStart = new Date(event.startDate);
      return eventStart >= rangeStart && eventStart <= rangeEnd;
    });
  }, [calendarData.displayedMonth, calendarData.events]);

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
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const handleConnect = () => {
      // Re-subscribe when reconnected
      if (!isSubscribed) {
        CalendarAPI.subscribe(athleteId);
        isSubscribed = true;
      }
      // Clear any pending reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    const handleDisconnect = (reason: string) => {
      isSubscribed = false;
      // If disconnected due to server closing or transport close, try to reconnect
      // Socket.IO will handle reconnection automatically, but we ensure subscription
      if (
        reason === 'io server disconnect' ||
        reason === 'transport close' ||
        reason === 'ping timeout'
      ) {
        // Socket.IO will reconnect automatically, but we'll re-subscribe on connect
        reconnectTimeout = setTimeout(() => {
          // If still disconnected after a delay, try to reconnect manually
          const socket = CalendarAPI.getSocket();
          if (!socket.connected) {
            CalendarAPI.connectSocket().catch((error) => {
              console.error('[Calendar] Failed to reconnect websocket:', error);
            });
          }
        }, 2000);
      }
    };

    const handleReconnectError = (error: Error) => {
      console.error('[Calendar] WebSocket reconnection error:', error);
    };

    // Connect to websocket
    CalendarAPI.connectSocket().catch((error) => {
      console.error('[Calendar] Failed to connect websocket:', error);
    });

    const socket = CalendarAPI.getSocket();

    // Set up connection/disconnection handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_error', handleReconnectError);

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
          // Invalidate the specific event query to update event details if open
          queryClient.invalidateQueries({
            queryKey: [eventKeys.getEvent, event.payload.eventId],
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
      socket.off('reconnect_error', handleReconnectError);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
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
  const useTemplateMutation = useUseEventTemplateMutation({
    onSuccess: () => {
      toast.success(m.event_created_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });
  const { registerCalendarHandler } = useSharedDnd() || {};

  const updateCycleDates = useCallback(
    (cycleId: number, startDate: Date, endDate: Date) => {
      // Update optimistically immediately for instant UI feedback
      queryClient.setQueriesData<Cycle[]>(
        { queryKey: [cycleKeys.getMyCycles] },
        (old) => {
          if (!old) return old;
          const updateIndex = old.findIndex((c) => c.cycleId === cycleId);
          if (updateIndex === -1) return old;
          const updated = [...old];
          updated[updateIndex] = {
            ...updated[updateIndex],
            startDate,
            endDate,
          } as Cycle;
          return updated;
        },
      );

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
    [updateCycleMutation, queryClient],
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

  const dndOnDragEnd = React.useCallback(
    async (e: DragEndEvent) => {
      if (!e.over?.id) return;
      const altKey = (e.activatorEvent as PointerEvent).altKey;
      const day = new Date(e.over?.id);
      const activeId = String(e.active.id);

      // Check if it's a template (id starts with "template-")
      if (activeId.startsWith('template-')) {
        const eventTemplateId = parseInt(activeId.replace('template-', ''));
        if (isNaN(eventTemplateId) || !athleteId) return;

        // Get the template from the drag data for optimistic update
        const activeData = e.active.data.current as
          | { type: string; template?: EventTemplate }
          | undefined;
        const template = activeData?.template;

        // Calculate start and end dates based on the template's default duration
        const startDate = new Date(day);
        startDate.setHours(8, 0, 0, 0);
        const endDate = new Date(day);
        endDate.setHours(9, 0, 0, 0);

        useTemplateMutation.mutate({
          eventTemplateId,
          body: {
            startDate,
            endDate,
            athleteId,
          },
          template, // Pass template for optimistic update
        });
        return;
      }

      // Handle regular event drag
      const eventId = Number(activeId);
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
    },
    [
      athleteId,
      events,
      useTemplateMutation,
      updateEventMutation,
      duplicateEventMutation,
    ],
  );

  // Register calendar handler with shared DnD context
  React.useEffect(() => {
    if (!registerCalendarHandler) return;
    return registerCalendarHandler(dndOnDragEnd);
  }, [registerCalendarHandler, dndOnDragEnd]);

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
        <EventContextMenuProvider>
          <CalendarContext.Provider value={memoizedValue}>
            <CalendarHeader />
            <div className="relative">
              <div className={isLoading ? 'opacity-50 transition-opacity' : ''}>
                <CalendarBody />
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader size="lg" />
                    <p className="text-sm text-muted-foreground">
                      {m.loading()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <CalendarWeeklyLoadChart
              weeks={calendarData.displayedWeeks}
              displayedMonth={calendarData.displayedMonth}
              weeklyLoadSummary={weeklyLoadSummaryMap}
              isLoading={weeklyLoadSummaryLoading}
              hasScheduledActivities={hasScheduledActivitiesWithinSixtyDays}
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
        </EventContextMenuProvider>
      </EventClipboardProvider>
    </div>
  );
}
