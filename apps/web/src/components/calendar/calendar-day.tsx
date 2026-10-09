import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';

import { Event } from '@openathlete/shared';

import { AiSetupDialog } from '../ai-settings';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '../ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { CalendarCycleSegment } from './calendar-cycle-segment';
import { CalendarDayActions } from './calendar-day-actions';
import { CalendarEvent } from './calendar-event';
import { useCalendarContext } from './hooks/use-calendar-context';
import { CycleDaySegment } from './utils/cycle-day-layout';

interface P {
  day: Date;
  events: Event[];
  cycleSegments?: CycleDaySegment[];
  variant?: 'month' | 'week';
}

export function CalendarDay({
  day,
  events,
  cycleSegments = [],
  variant = 'month',
}: P) {
  const {
    displayedMonth,
    allowCreate,
    dragSelection,
    setDragSelection,
    createCycle,
    cycleResize,
    setCycleResize,
  } = useCalendarContext();
  const [aiSetupOpen, setAiSetupOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // A left press on this day's empty area that has not left the day yet:
  // released here, it is a click (planning menu); elsewhere, a drag (cycle)
  const pressRef = useRef<{ x: number; y: number } | null>(null);
  const dayOfMonth = day.getDate();
  const isToday = day.toDateString() === new Date().toDateString();
  const isCurrentMonth =
    variant === 'week' || day.getMonth() === displayedMonth.getMonth();
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
    // React events bubble through portals: a press in a card's context menu
    // reaches the day, but is not a press on the day
    if (!e.currentTarget.contains(e.target as Node)) return;

    // Only start drag selection on empty area (not on events or cycles)
    const target = e.target as HTMLElement;
    if (
      target.closest('.calendar-event') ||
      target.closest('[data-cycle-segment]')
    ) {
      return;
    }

    if (e.button === 0 && allowCreate) {
      pressRef.current = { x: e.clientX, y: e.clientY };
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
    const pressedHere = pressRef.current !== null;
    pressRef.current = null;
    if (!dragSelection) return;

    // Released without leaving the day it was pressed on: a click, which
    // opens the planning menu as a right click would
    if (pressedHere) {
      setDragSelection(null);
      setMenuOpen(true);
      return;
    }

    // A drag ends on this day. The day itself is the end of the range: the
    // selection state may not have caught up with a fast pointer yet.
    const start = dragSelection.startDate.getTime();
    const end = day.getTime();
    const normalizedStart = new Date(Math.min(start, end));
    const normalizedEnd = new Date(Math.max(start, end));
    normalizedStart.setHours(0, 0, 0, 0);
    normalizedEnd.setHours(23, 59, 59, 999);

    createCycle(normalizedStart, normalizedEnd);
    setDragSelection(null);
  };

  return (
    <div
      className={cn(
        'group/day min-h-32 flex-1 [&:not(:last-child)]:border-r-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 select-none',
        variant === 'week' && 'min-w-0 min-h-64 border-b md:border-b-0',
        isOver ? 'bg-gray-100 dark:bg-gray-800/50' : '',
        isInDragSelection ? 'bg-blue-50 dark:bg-blue-950/30' : '',
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        // Leaving the day turns the press into a drag
        pressRef.current = null;
      }}
      onMouseUp={handleMouseUp}
      ref={setNodeRef}
    >
      <ContextMenu>
        <ContextMenuTrigger
          className="flex-1 flex flex-col h-full"
          data-calendar-day={format(day, 'yyyy-MM-dd')}
        >
          <div
            className={cn(
              'relative flex justify-center p-2 text-sm font-medium text-gray-600',
              {
                'text-red-500 font-bold': isToday,
                'text-gray-400': !isCurrentMonth,
              },
            )}
          >
            <span>
              {variant === 'week'
                ? day.toLocaleDateString(getDateLocale(getLocale()), {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : dayOfMonth}
            </span>
            {allowCreate && (
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  {/* Shown on hover and keyboard focus; the anchor of the
                      menu a simple click on the day opens */}
                  <button
                    type="button"
                    data-calendar-day-plan
                    aria-label={m.calendar_plan_on_day({
                      date: day.toLocaleDateString(getDateLocale(getLocale()), {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      }),
                    })}
                    onMouseDown={(event) => event.stopPropagation()}
                    className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/day:opacity-100 data-[state=open]:opacity-100"
                  >
                    <Plus className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <CalendarDayActions
                    day={day}
                    menu="dropdown"
                    onAiSetupNeeded={() => setAiSetupOpen(true)}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                <CalendarEvent
                  key={event.eventId}
                  event={event}
                  detailed={variant === 'week'}
                />
              ))}
          </div>
        </ContextMenuTrigger>
        {allowCreate && (
          <ContextMenuContent className="w-64">
            <CalendarDayActions
              day={day}
              menu="context"
              onAiSetupNeeded={() => setAiSetupOpen(true)}
            />
          </ContextMenuContent>
        )}
      </ContextMenu>
      <AiSetupDialog
        open={aiSetupOpen}
        onOpenChange={setAiSetupOpen}
        analyticsSource="calendar_day"
      />
    </div>
  );
}
