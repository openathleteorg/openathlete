import { useAiTaskAvailable } from '@/api/ai-settings';
import { useGetMyAthleteQuery } from '@/api/athlete';
import { CalendarAPI } from '@/api/calendar/calendar.api';
import { useGetMyCyclesQuery, useUpdateCycleMutation } from '@/api/cycle';
import { cycleKeys } from '@/api/cycle/cycle.keys';
import {
  useDuplicateEventMutation,
  useSetRelatedActivityMutation,
  useUnsetRelatedActivityMutation,
  useUpdateEventMutation,
} from '@/api/event';
import { useEventCommentCountsQuery } from '@/api/event-comments';
import { useUseEventTemplateMutation } from '@/api/event-template';
import { eventKeys } from '@/api/event/event.keys';
import { useGetLatestMetricsQuery } from '@/api/metric/metric.hooks';
import {
  useDailyFormQuery,
  useWeeklyLoadSummaryQuery,
} from '@/api/training-load';
import { trainingLoadKeys } from '@/api/training-load/training-load.keys';
import {
  CalendarView,
  useCalendarData,
} from '@/components/calendar/hooks/use-calendar-data';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { type PageAction, useSetPageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { CALENDAR_COLORED_BY, getItem, setItem } from '@/utils/local-storage';
import { DragEndEvent } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import {
  Activity,
  Award,
  ChevronDown,
  Copy,
  Plus,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AiTask,
  CreateEventDto,
  Cycle,
  DAILY_WELLNESS_SIGNALS,
  EVENT_TYPE,
  Event,
  EventTemplate,
} from '@openathlete/shared';

import { AIGenerateEventDialog } from '../ai-generate-event-dialog/ai-generate-event.dialog';
import { AiSetupDialog } from '../ai-settings';
import { CreateCycleDialog } from '../create-cycle-dialog';
import { CreateEventDialog } from '../create-event-dialog';
import { CreateEventFromTemplateDialog } from '../create-event-from-template-dialog/create-event-from-template.dialog';
import { ImportFitDialog } from '../import-fit-dialog/import-fit-dialog';
import { BulkWorkoutSelectButton } from './bulk-workout-select-button';
import { CalendarBody } from './calendar-body';
import { CalendarBulkDelete } from './calendar-bulk-delete';
import { CalendarEventDetailsDialog } from './calendar-event-details.dialog';
import { CalendarHeader } from './calendar-header';
import { CalendarMobileList } from './calendar-mobile-list';
import { CalendarSeasonView } from './calendar-season-view';
import { CalendarShortcutsDialog } from './calendar-shortcuts-dialog';
import { CalendarViewToggle } from './calendar-view-toggle';
import { CalendarWeekView } from './calendar-week-view';
import { ComplianceLegend } from './compliance-badge';
import { CalendarContext } from './contexts/calendar-context';
import { EventClipboardProvider } from './contexts/event-clipboard-context';
import { EventContextMenuProvider } from './contexts/event-context-menu-context';
import { useSharedDnd } from './contexts/shared-dnd-context';
import { CycleDetailsDialog } from './cycle-details.dialog';
import { useCalendarDisplay } from './hooks/use-calendar-display';
import { CalendarContextType } from './types/calendar-context';
import { COLORED_BY } from './types/filter';
import { UnavailableSessionsDialog } from './unavailable-sessions-dialog';
import { isPlannedEvent } from './utils/compliance';
import { isUnavailableKind } from './utils/cycle-kind';
import { parseLinkDropId } from './utils/link-drop';
import {
  COPY_KEY,
  isKeyHeld,
  isOverlayOpen,
  isUndoKey,
  shortcutFor,
  trackHeldKeys,
} from './utils/shortcuts';
import { sessionsDuring } from './utils/unavailability';
import { undoLast, undoable } from './utils/undo';
import { getUtcWeekKey, getWeekEnd, getWeekStart } from './utils/week';

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
  const posthog = usePostHog();
  const isMobile = useIsMobile();
  const [planningDate, setPlanningDate] = useState(() => new Date());
  const [view, setViewState] = useState<CalendarView>(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    const saved = requested ?? getItem('calendar_view');
    return saved === 'week' || saved === 'season' ? saved : 'month';
  });
  const calendarData = useCalendarData({ events, view });
  const { goToWeek, displayedMonth } = calendarData;
  const setView = useCallback(
    (next: CalendarView) => {
      if (next === 'week') goToWeek(displayedMonth);
      setViewState(next);
      setItem('calendar_view', next);
    },
    [goToWeek, displayedMonth],
  );
  const { data: cycles } = useGetMyCyclesQuery(undefined, athleteId);
  const { available: hasAIAccess } = useAiTaskAvailable(
    AiTask.EVENT_GENERATION,
  );
  const [aiSetupOpen, setAiSetupOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const weekRangeStart = calendarData.displayedWeeks[0]?.[0];
  const weekRangeEnd =
    calendarData.displayedWeeks[calendarData.displayedWeeks.length - 1]?.[6];

  const loadRange = useMemo(() => {
    if (!weekRangeStart || !weekRangeEnd) {
      return { start: undefined, end: undefined };
    }

    const start = getWeekStart(weekRangeStart);
    const end = getWeekEnd(weekRangeEnd);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
  }, [weekRangeStart, weekRangeEnd]);

  const { display, updateDisplay } = useCalendarDisplay();
  // Files import into the signed-in athlete's own activities only
  const { data: myAthlete } = useGetMyAthleteQuery();
  const ownCalendar = !athleteId || athleteId === myAthlete?.athleteId;
  const [droppedFiles, setDroppedFiles] = useState<{
    files: File[];
    at: number;
  } | null>(null);
  const importFiles = useMemo(
    () =>
      ownCalendar && myAthlete
        ? (files: File[]) => setDroppedFiles({ files, at: Date.now() })
        : undefined,
    [ownCalendar, myAthlete],
  );
  // Wellness only for athletes who track it day by day: no request otherwise
  const { data: latestMetrics, isPending: latestMetricsPending } =
    useGetLatestMetricsQuery(athleteId, {
      enabled: Boolean(athleteId),
    });
  const recordsWellness = DAILY_WELLNESS_SIGNALS.some(
    (type) => latestMetrics?.[type],
  );
  const { data: dailyFormList } = useDailyFormQuery({
    startDate: loadRange.start,
    endDate: loadRange.end,
    athleteId,
    wellness: display.wellness && recordsWellness,
    // The wellness row and the weekly load charts read it; the phone's
    // list of months shows neither
    // Once the metrics say whether to ask for wellness: one request, not two
    enabled:
      (display.wellness || display.summary.load) &&
      (!isMobile || view === 'week') &&
      !latestMetricsPending,
  });
  const { data: commentCountList } = useEventCommentCountsQuery({
    startDate: loadRange.start,
    endDate: loadRange.end,
    athleteId,
  });
  const commentCounts = useMemo(
    () =>
      Object.fromEntries(
        (commentCountList ?? []).map(({ eventId, ...counts }) => [
          eventId,
          counts,
        ]),
      ),
    [commentCountList],
  );
  const dailyForm = useMemo(
    () =>
      Object.fromEntries(
        (dailyFormList ?? []).map((day) => [day.date, day]),
      ) as CalendarContextType['dailyForm'],
    [dailyFormList],
  );

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
        [getUtcWeekKey(summary.weekStart)]: summary,
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
  const [unavailableReview, setUnavailableReview] = useState<{
    cycle: Cycle;
    sessions: Event[];
  } | null>(null);
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
  const [filter, setFilter] = useState<(event: Event) => boolean>(
    () => () => true,
  );
  const [coloredBy, setColoredBy] = useState<COLORED_BY | null>(() => {
    const savedValue = getItem(CALENDAR_COLORED_BY);
    return savedValue ? (savedValue as COLORED_BY) : null;
  });
  const updateEventMutation = useUpdateEventMutation();
  const duplicateEventMutation = useDuplicateEventMutation({
    onSuccess: (duplicated) => {
      posthog?.capture(AnalyticsEvent.event_duplicated, {
        event_type: duplicated.type,
      });
    },
  });
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
  const setRelatedActivityMutation = useSetRelatedActivityMutation();
  const unsetRelatedActivityMutation = useUnsetRelatedActivityMutation();

  /** An activity dropped on a planned session: link them, undoably */
  const linkActivity = useCallback(
    (activityId: Event['eventId'], sessionId: Event['eventId']) => {
      const session = events?.find(
        (event) => event.eventId === sessionId && isPlannedEvent(event),
      );
      if (!session || !isPlannedEvent(session)) return;
      if (session.relatedActivity?.eventId === activityId) return;
      // Undoing puts the activity back where it was
      const previous = events?.find(
        (event) =>
          isPlannedEvent(event) &&
          event.relatedActivity?.eventId === activityId,
      );

      setRelatedActivityMutation.mutate(
        { eventId: sessionId, activityId },
        {
          onSuccess: () => {
            posthog?.capture(AnalyticsEvent.activity_linked, {
              source: 'calendar_drag',
            });
            undoable(m.calendar_link_done({ name: session.name }), () =>
              previous
                ? setRelatedActivityMutation.mutateAsync({
                    eventId: previous.eventId,
                    activityId,
                  })
                : unsetRelatedActivityMutation.mutateAsync(sessionId),
            );
          },
          onError: () => toast.error(m.calendar_link_failed()),
        },
      );
    },
    [events, posthog, setRelatedActivityMutation, unsetRelatedActivityMutation],
  );

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
      view,
      setView,
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
      showShortcuts: () => setShortcutsOpen(true),
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
      athleteId,
      allowCreate,
      filter,
      setFilter,
      coloredBy,
      setColoredBy,
      weeklyLoadSummary: weeklyLoadSummaryMap,
      weeklyLoadSummaryLoading,
      estimatingEvents,
      display,
      updateDisplay,
      dailyForm,
      importFiles,
      commentCounts,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      view,
      setView,
      calendarData.weekStart,
      calendarData.displayedMonth,
      calendarData.events,
      cycles,
      dragSelection,
      cycleResize,
      filter,
      coloredBy,
      eventDetailsOpened,
      allowCreate,
      athleteId,
      weeklyLoadSummaryMap,
      weeklyLoadSummaryLoading,
      estimatingEvents,
      display,
      updateDisplay,
      dailyForm,
      importFiles,
      commentCounts,
    ],
  );

  const dndOnDragEnd = React.useCallback(
    async (e: DragEndEvent) => {
      if (!e.over?.id) return;
      const sessionId = parseLinkDropId(e.over.id);
      if (sessionId !== null) {
        linkActivity(Number(e.active.id), sessionId);
        return;
      }
      // Alt or C held while dragging copies instead of moving
      const altKey =
        (e.activatorEvent as PointerEvent).altKey || isKeyHeld(COPY_KEY);
      const day = new Date(e.over?.id);
      const activeId = String(e.active.id);

      // Check if it's a template (id starts with "template-")
      if (activeId.startsWith('template-')) {
        const eventTemplateId = Number.parseInt(
          activeId.replace('template-', ''),
        );
        if (Number.isNaN(eventTemplateId) || !athleteId) return;

        // Get the template from the drag data for optimistic update
        const activeData = e.active.data.current as
          { type: string; template?: EventTemplate } | undefined;
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
      linkActivity,
      useTemplateMutation,
      updateEventMutation,
      duplicateEventMutation,
    ],
  );

  React.useEffect(() => {
    if (!registerCalendarHandler) return;
    return registerCalendarHandler(dndOnDragEnd);
  }, [registerCalendarHandler, dndOnDragEnd]);

  useEffect(() => trackHeldKeys(), []);

  const { nextWeek, prevWeek, goToCurrentWeek } = calendarData;
  const { nextMonth, prevMonth, goToCurrentMonth } = calendarData;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isUndoKey(event, isOverlayOpen())) {
        if (undoLast()) event.preventDefault();
        return;
      }
      const shortcut = shortcutFor(event, isOverlayOpen());
      if (!shortcut) return;
      event.preventDefault();
      const isWeek = view === 'week';
      switch (shortcut) {
        case 'today':
          return isWeek ? goToCurrentWeek() : goToCurrentMonth();
        case 'previous':
          return isWeek ? prevWeek() : prevMonth();
        case 'next':
          return isWeek ? nextWeek() : nextMonth();
        case 'monthView':
          return setView('month');
        case 'weekView':
          return setView('week');
        case 'seasonView':
          return setView('season');
        case 'help':
          return setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    view,
    setView,
    nextWeek,
    prevWeek,
    goToCurrentWeek,
    nextMonth,
    prevMonth,
    goToCurrentMonth,
  ]);

  const mobileActions = useMemo<PageAction[]>(() => {
    if (!isMobile || !allowCreate) return [];

    const actions: PageAction[] = [
      {
        label: m.plan_a_training(),
        icon: Activity,
        onClick: () => {
          setCreateEventDialog({
            date: planningDate,
            type: EVENT_TYPE.TRAINING,
          });
        },
      },
      {
        label: m.set_a_template(),
        icon: Copy,
        onClick: () => setCreateEventFromTemplateDialog(planningDate),
      },
      {
        label: m.plan_a_competition(),
        icon: Award,
        onClick: () => {
          setCreateEventDialog({
            date: planningDate,
            type: EVENT_TYPE.COMPETITION,
          });
        },
      },
      {
        label: m.plan_a_note(),
        icon: StickyNote,
        onClick: () => {
          setCreateEventDialog({ date: planningDate, type: EVENT_TYPE.NOTE });
        },
      },
    ];

    // Shown without AI too: it leads to the AI settings
    actions.splice(2, 0, {
      label: m.create_with_ai(),
      icon: Sparkles,
      onClick: () =>
        hasAIAccess
          ? setAIGenerateEventDialog(planningDate)
          : setAiSetupOpen(true),
    });

    return actions;
  }, [isMobile, allowCreate, hasAIAccess, planningDate]);

  useSetPageActions(mobileActions);

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
      {mobileActions.length > 0 && (
        <div
          data-calendar-planning-toolbar
          className="flex flex-wrap items-end gap-3 px-4 py-2 md:hidden"
        >
          <label className="flex min-w-36 flex-1 flex-col gap-1 text-sm font-medium">
            {m.date()}
            <Input
              type="date"
              className="h-11"
              value={format(planningDate, 'yyyy-MM-dd')}
              onChange={(event) => {
                const date = parseISO(event.target.value);
                if (isValid(date)) setPlanningDate(date);
              }}
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-11" data-calendar-plan-trigger>
                <Plus className="size-4" />
                {m.plan()}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-w-[calc(100vw-2rem)]"
            >
              {mobileActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onSelect={action.onClick}
                  className="min-h-11"
                >
                  {action.icon && <action.icon className="size-4" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <EventClipboardProvider>
        <EventContextMenuProvider>
          <CalendarContext.Provider value={memoizedValue}>
            <CalendarBulkDelete
              header={
                !isMobile || view !== 'month' ? (
                  <CalendarHeader />
                ) : (
                  <div className="flex flex-wrap gap-2 px-4">
                    <CalendarViewToggle />
                    <BulkWorkoutSelectButton />
                    <ComplianceLegend className="w-full" />
                  </div>
                )
              }
            >
              <div className={isMobile ? 'w-full flex-1' : 'relative'}>
                {view === 'week' ? (
                  <CalendarWeekView isLoading={isLoading} />
                ) : view === 'season' ? (
                  <CalendarSeasonView />
                ) : isMobile ? (
                  <div className="w-full h-full">
                    <CalendarMobileList isLoading={isLoading} />
                  </div>
                ) : (
                  <>
                    <div
                      className={
                        isLoading ? 'opacity-50 transition-opacity' : ''
                      }
                    >
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
                  </>
                )}
              </div>
              {importFiles && (
                <ImportFitDialog trigger={false} dropped={droppedFiles} />
              )}
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
              <AiSetupDialog
                open={aiSetupOpen}
                onOpenChange={setAiSetupOpen}
                analyticsSource="calendar_mobile"
              />
              <CalendarShortcutsDialog
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
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
                event={events?.find(
                  (event) => event.eventId === editEventDialog,
                )}
                onDeleted={() => setEventDetailsOpened(null)}
              />
              <CalendarEventDetailsDialog
                open={eventDetailsOpened !== null}
                onClose={() => setEventDetailsOpened(null)}
                event={events?.find((e) => e.eventId === eventDetailsOpened)}
                // Opens over the details, which show the change once saved
                onEditEvent={() => setEditEventDialog(eventDetailsOpened)}
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
                onCreated={(cycle) => {
                  // A period without training: decide about its sessions
                  if (!isUnavailableKind(cycle.kind)) return;
                  const sessions = sessionsDuring(calendarData.events, cycle);
                  if (sessions.length)
                    setUnavailableReview({ cycle, sessions });
                }}
              />
              <UnavailableSessionsDialog
                key={unavailableReview?.cycle.cycleId}
                cycle={unavailableReview?.cycle ?? null}
                sessions={unavailableReview?.sessions ?? []}
                onClose={() => setUnavailableReview(null)}
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
            </CalendarBulkDelete>
          </CalendarContext.Provider>
        </EventContextMenuProvider>
      </EventClipboardProvider>
    </div>
  );
}
