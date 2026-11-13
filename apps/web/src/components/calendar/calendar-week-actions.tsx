import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { EventAPI } from '@/api/event';
import { eventKeys } from '@/api/event/event.keys';
import { invalidateTrainingLoadQueries } from '@/api/training-load/training-load.keys';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  ClipboardPaste,
  Copy,
  MoreHorizontal,
  Scissors,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Event } from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { PlanForAthletesDialog } from '../plan-for-athletes/plan-for-athletes-dialog';
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
import { restoreDeleted } from './utils/restore-deleted';
import { SHIFT_OPTIONS } from './utils/shift-options';
import { undoable } from './utils/undo';
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
  const [planningForOthers, setPlanningForOthers] = useState(false);
  const { data: coached } = useGetMyCoachedAthletesQuery();

  const plan = weekPlan(events, weekStart);
  const movable = movablePlan(plan);
  const deletable = deletablePlan(plan);
  const pasteOffset = weekClipboard
    ? weekOffsetDays(weekClipboard.weekStart, weekStart)
    : 0;
  const canPaste = !!weekClipboard && pasteOffset !== 0;
  const sourceAthleteId = plan[0]?.athleteId ?? null;
  // Someone else to copy to: a coach with an athlete besides this calendar's
  const canCopyToOthers =
    plan.length > 0 &&
    (coached ?? []).some((athlete) => athlete.athleteId !== sourceAthleteId);
  const firstDay = plan.length
    ? format(
        new Date(
          Math.min(...plan.map((event) => new Date(event.startDate).getTime())),
        ),
        'yyyy-MM-dd',
      )
    : '';
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
    const removed = deletable.filter((event) =>
      deleted.includes(event.eventId),
    );
    if (removed.length) {
      undoable(m.calendar_week_deleted({ count: removed.length }), () =>
        restoreDeleted(queryClient, removed),
      );
    }
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
          {canCopyToOthers && (
            <DropdownMenuItem
              onSelect={() => setPlanningForOthers(true)}
              data-week-copy-to-athletes
            >
              <Users className="size-4" />
              {m.plan_for_athletes_week_action()}
            </DropdownMenuItem>
          )}
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
      {canCopyToOthers && (
        <PlanForAthletesDialog
          open={planningForOthers}
          onClose={() => setPlanningForOthers(false)}
          source={{
            kind: 'events',
            eventIds: plan.map((event) => event.eventId),
          }}
          label={m.plan_for_athletes_week_label({
            count: plan.length,
            week: weekLabel,
          })}
          defaultDate={firstDay}
          sourceAthleteId={sourceAthleteId}
        />
      )}
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
