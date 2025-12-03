import { useDuplicateEventMutation } from '@/api/event';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useDroppable } from '@dnd-kit/core';
import {
  Activity,
  Award,
  ClipboardPaste,
  FileText,
  StickyNote,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { EVENT_TYPE, Event, FeatureName } from '@openathlete/shared';

import { PaywallDialog } from '../paywall';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { SparklesIcon } from '../ui/sparkles-icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CalendarCycleSegment } from './calendar-cycle-segment';
import { CalendarEvent } from './calendar-event';
import { useEventClipboard } from './contexts/event-clipboard-context';
import { useCalendarContext } from './hooks/use-calendar-context';
import { CycleDaySegment } from './utils/cycle-day-layout';

interface P {
  day: Date;
  events: Event[];
  cycleSegments?: CycleDaySegment[];
}

export function CalendarDay({ day, events, cycleSegments = [] }: P) {
  const {
    displayedMonth,
    createEvent,
    allowCreate,
    createEventFromTemplate,
    createEventWithAI,
    dragSelection,
    setDragSelection,
    createCycle,
    cycleResize,
    setCycleResize,
  } = useCalendarContext();
  const { clipboard, hasClipboard } = useEventClipboard();
  const { hasAccess: hasAIAccess } = useFeatureAccess(
    FeatureName.AI_GENERATION,
  );
  const [paywallOpen, setPaywallOpen] = useState(false);
  const duplicateEventMutation = useDuplicateEventMutation({
    onSuccess: () => {
      toast.success(m.event_created_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });
  const dayOfMonth = day.getDate();
  const isToday = day.toDateString() === new Date().toDateString();
  const isCurrentMonth = day.getMonth() === displayedMonth.getMonth();
  const { isOver, setNodeRef } = useDroppable({
    id: day.toISOString(),
  });

  // Check if this day is in the drag selection range (handle both directions)
  const isInDragSelection =
    dragSelection &&
    (() => {
      const minDate = new Date(
        Math.min(
          dragSelection.startDate.getTime(),
          dragSelection.endDate.getTime(),
        ),
      );
      const maxDate = new Date(
        Math.max(
          dragSelection.startDate.getTime(),
          dragSelection.endDate.getTime(),
        ),
      );
      return day >= minDate && day <= maxDate;
    })();

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag selection on empty area (not on events or cycles)
    const target = e.target as HTMLElement;
    if (
      target.closest('.calendar-event') ||
      target.closest('[data-cycle-segment]')
    ) {
      return;
    }

    if (e.button === 0 && allowCreate) {
      // Left click - start drag selection for cycles
      const startDate = new Date(day);
      startDate.setHours(0, 0, 0, 0);
      setDragSelection({ startDate, endDate: startDate });
    }
  };

  const handleMouseEnter = () => {
    // Handle cycle resize - update preview without saving
    if (cycleResize) {
      const dayNormalized = new Date(day);
      dayNormalized.setHours(0, 0, 0, 0);

      if (cycleResize.edge === 'start') {
        // Resizing start - check if valid
        const newStart = dayNormalized;
        if (new Date(newStart) <= cycleResize.originalEnd) {
          setCycleResize({
            ...cycleResize,
            currentStart: newStart,
          });
        }
      } else {
        // Resizing end - check if valid
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        if (dayNormalized >= cycleResize.originalStart) {
          setCycleResize({
            ...cycleResize,
            currentEnd: dayEnd,
          });
        }
      }
      return;
    }

    // Handle drag selection for creating new cycles
    if (dragSelection && dragSelection.startDate) {
      const endDate = new Date(day);
      endDate.setHours(23, 59, 59, 999);
      setDragSelection({
        startDate: dragSelection.startDate,
        endDate,
      });
    }
  };

  const handleMouseUp = () => {
    if (dragSelection && dragSelection.startDate !== dragSelection.endDate) {
      // Normalize dates - ensure startDate <= endDate regardless of drag direction
      const normalizedStart = new Date(
        Math.min(
          dragSelection.startDate.getTime(),
          dragSelection.endDate.getTime(),
        ),
      );
      const normalizedEnd = new Date(
        Math.max(
          dragSelection.startDate.getTime(),
          dragSelection.endDate.getTime(),
        ),
      );

      normalizedStart.setHours(0, 0, 0, 0);
      normalizedEnd.setHours(23, 59, 59, 999);

      // Create cycle with the normalized date range
      createCycle(normalizedStart, normalizedEnd);
      setDragSelection(null);
    }
  };

  return (
    <div
      className={cn(
        'min-h-32 flex-1 [&:not(:last-child)]:border-r-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 select-none',
        isOver ? 'bg-gray-100 dark:bg-gray-800/50' : '',
        isInDragSelection ? 'bg-blue-50 dark:bg-blue-950/30' : '',
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      ref={setNodeRef}
    >
      <ContextMenu>
        <ContextMenuTrigger className="flex-1 flex flex-col h-full">
          <div
            className={cn(
              'flex justify-center p-2 text-sm font-medium text-gray-600',
              {
                'text-red-500 font-bold': isToday,
                'text-gray-400': !isCurrentMonth,
              },
            )}
          >
            <span>{dayOfMonth}</span>
          </div>

          {/* Cycles display - positioned for cross-cell rendering */}
          {cycleSegments.length > 0 && (
            <div
              className="relative pb-1"
              style={{
                height: `${Math.max(...cycleSegments.map((s) => s.rowIndex + 1)) * 22}px`,
              }}
            >
              {cycleSegments.map((segment, idx) => (
                <CalendarCycleSegment
                  key={`${segment.cycle.cycleId}-${idx}`}
                  segment={segment}
                />
              ))}
            </div>
          )}

          <div className="flex-1 p-1 pb-2 pt-0 flex flex-col gap-1">
            {events
              .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
              .map((event) => (
                <CalendarEvent key={event.eventId} event={event} />
              ))}
          </div>
        </ContextMenuTrigger>
        {allowCreate && (
          <ContextMenuContent className="w-64">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ContextMenuItem
                    disabled={!hasClipboard}
                    onClick={() => {
                      if (!clipboard) return;
                      const originalStartDate = new Date(clipboard.startDate);
                      const originalEndDate = new Date(clipboard.endDate);
                      const duration =
                        originalEndDate.getTime() - originalStartDate.getTime();

                      const newStartDate = new Date(day);
                      newStartDate.setHours(
                        originalStartDate.getHours(),
                        originalStartDate.getMinutes(),
                        originalStartDate.getSeconds(),
                        originalStartDate.getMilliseconds(),
                      );

                      const newEndDate = new Date(
                        newStartDate.getTime() + duration,
                      );

                      duplicateEventMutation.mutate({
                        eventId: clipboard.eventId,
                        body: {
                          startDate: newStartDate,
                          endDate: newEndDate,
                        },
                      });
                    }}
                  >
                    <ClipboardPaste className="w-4 h-4 mr-2" />
                    {m.paste()}
                  </ContextMenuItem>
                </div>
              </TooltipTrigger>
              {!hasClipboard && (
                <TooltipContent>{m.nothing_to_paste()}</TooltipContent>
              )}
            </Tooltip>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                if (hasAIAccess) {
                  createEventWithAI(day);
                } else {
                  setPaywallOpen(true);
                }
              }}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {m.create_with_ai()}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => createEventFromTemplate(day)}>
              <FileText className="w-4 h-4 mr-2" />
              {m.set_a_template()}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => createEvent(day, EVENT_TYPE.TRAINING)}
            >
              <Activity className="w-4 h-4 mr-2" />
              {m.plan_a_training()}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => createEvent(day, EVENT_TYPE.COMPETITION)}
            >
              <Award className="w-4 h-4 mr-2" />
              {m.plan_a_competition()}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => createEvent(day, EVENT_TYPE.NOTE)}>
              <StickyNote className="w-4 h-4 mr-2" />
              {m.plan_a_note()}
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="ai-feature"
      />
    </div>
  );
}
