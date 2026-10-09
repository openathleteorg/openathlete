import { EventAPI } from '@/api/event';
import { eventKeys } from '@/api/event/event.keys';
import { invalidateTrainingLoadQueries } from '@/api/training-load/training-load.keys';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  ClipboardPaste,
  Copy,
  MoreHorizontal,
  Scissors,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Event } from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useEventClipboard } from './contexts/event-clipboard-context';
import { useShiftActions } from './hooks/use-shift-actions';
import { deleteWorkoutsSequentially } from './utils/bulk-delete';
import { SHIFT_OPTIONS } from './utils/shift-options';
import {
  deletablePlan,
  movablePlan,
  weekOffsetDays,
  weekPlan,
} from './utils/week-actions';

/**
 * The "…" menu of a week: copy, cut and paste it on another week, shift its
 * sessions, or delete them. Every change but the deletion (which asks first)
 * can be undone from its toast.
 */
export function CalendarWeekActions({
  weekStart,
  events,
}: {
  weekStart: Date;
  /** The events shown for the week (the sport filter applies) */
  events: Event[];
}) {
  const queryClient = useQueryClient();
  const { weekClipboard, setWeekClipboard } = useEventClipboard();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const shift = useShiftActions();
  const busy = shift.busy || deleting;

  const plan = weekPlan(events, weekStart);
  const movable = movablePlan(plan);
  const deletable = deletablePlan(plan);
  const pasteOffset = weekClipboard
    ? weekOffsetDays(weekClipboard.weekStart, weekStart)
    : 0;
  const canPaste = !!weekClipboard && pasteOffset !== 0;
  const weekLabel = weekStart.toLocaleDateString(getDateLocale(getLocale()), {
    day: 'numeric',
    month: 'short',
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    invalidateTrainingLoadQueries(queryClient);
  };
  const paste = () => {
    if (!weekClipboard || !canPaste) return;
    const { mode, eventIds } = weekClipboard;
    if (mode === 'cut') {
      shift.move(eventIds, pasteOffset);
      // A cut week lands once
      setWeekClipboard(null);
    } else {
      shift.copy(eventIds, pasteOffset);
    }
  };

  const remove = async () => {
    setDeleting(true);
    const { deleted, failed: notDeleted } = await deleteWorkoutsSequentially(
      deletable.map((event) => event.eventId),
      EventAPI.deleteEvent,
    );
    setDeleting(false);
    setConfirmDelete(false);
    refresh();
    if (notDeleted.length) toast.error(m.calendar_week_action_failed());
    else toast.success(m.calendar_week_deleted({ count: deleted.length }));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground"
            aria-label={m.calendar_week_actions({ week: weekLabel })}
            data-week-actions
            disabled={busy}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem
            disabled={!plan.length}
            onSelect={() => {
              setWeekClipboard({
                mode: 'copy',
                weekStart,
                eventIds: plan.map((event) => event.eventId),
              });
              toast.info(m.calendar_week_copied());
            }}
          >
            <Copy className="size-4" />
            {m.calendar_week_copy()}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!movable.length}
            onSelect={() => {
              setWeekClipboard({
                mode: 'cut',
                weekStart,
                eventIds: movable.map((event) => event.eventId),
              });
              toast.info(m.calendar_week_cut_done());
            }}
          >
            <Scissors className="size-4" />
            {m.calendar_week_cut()}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canPaste} onSelect={paste}>
            <ClipboardPaste className="size-4" />
            {m.calendar_week_paste()}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={!movable.length}
              className="gap-2 [&_svg]:text-muted-foreground"
            >
              <ArrowLeftRight className="size-4" />
              {m.calendar_week_shift()}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {SHIFT_OPTIONS.map(({ offsetDays, label }) => (
                <DropdownMenuItem
                  key={offsetDays}
                  onSelect={() =>
                    shift.move(
                      movable.map((event) => event.eventId),
                      offsetDays,
                    )
                  }
                >
                  {label()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!deletable.length}
            onSelect={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            {m.calendar_week_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmAction
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title={m.calendar_week_delete()}
        message={m.calendar_week_delete_confirm({ count: deletable.length })}
        isLoading={deleting}
      />
    </>
  );
}
