import { EventAPI } from '@/api/event';
import { eventKeys } from '@/api/event/event.keys';
import { invalidateTrainingLoadQueries } from '@/api/training-load/training-load.keys';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

import { Cycle, Event } from '@openathlete/shared';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useShiftActions } from './hooks/use-shift-actions';
import { deleteWorkoutsSequentially } from './utils/bulk-delete';
import { daysAfter } from './utils/unavailability';

type Choice = 'move' | 'delete' | 'keep';

const formatDay = (date: Date) =>
  date.toLocaleDateString(getDateLocale(getLocale()), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/**
 * After a period without training is created, shows the sessions it covers
 * and moves them after it, deletes them or keeps them.
 */
export function UnavailableSessionsDialog({
  cycle,
  sessions,
  onClose,
}: {
  cycle: Cycle | null;
  sessions: Event[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const shift = useShiftActions();
  const [choice, setChoice] = useState<Choice>('move');
  const [deleting, setDeleting] = useState(false);
  if (!cycle) return null;

  const offset = daysAfter(cycle);
  const apply = async () => {
    const ids = sessions.map((event) => event.eventId);
    if (choice === 'move') {
      await shift.move(ids, offset);
    } else if (choice === 'delete') {
      setDeleting(true);
      const { failed } = await deleteWorkoutsSequentially(
        ids,
        EventAPI.deleteEvent,
      );
      setDeleting(false);
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      invalidateTrainingLoadQueries(queryClient);
      if (failed.length) toast.error(m.calendar_week_action_failed());
      else toast.success(m.calendar_week_deleted({ count: ids.length }));
    }
    onClose();
  };

  const options: { value: Choice; label: string; help?: string }[] = [
    {
      value: 'move',
      label: m.unavailable_review_move(),
      help: m.unavailable_review_move_help({ days: offset }),
    },
    { value: 'delete', label: m.unavailable_review_delete() },
    { value: 'keep', label: m.unavailable_review_keep() },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && !deleting && onClose()}>
      <DialogContent className="sm:max-w-lg" data-unavailable-review>
        <DialogHeader>
          <DialogTitle>{m.unavailable_review_title()}</DialogTitle>
          <DialogDescription>
            {m.unavailable_review_description({
              start: formatDay(new Date(cycle.startDate)),
              end: formatDay(new Date(cycle.endDate)),
              count: sessions.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {sessions.map((event) => (
            <li
              key={event.eventId}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="truncate font-medium">{event.name}</span>
              <span className="whitespace-nowrap text-muted-foreground">
                <span className={cn(choice !== 'keep' && 'line-through')}>
                  {formatDay(event.startDate)}
                </span>
                {choice === 'move' && (
                  <span className="text-foreground">
                    {' → '}
                    {formatDay(addDays(event.startDate, offset))}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div role="radiogroup" className="grid gap-2">
          {options.map(({ value, label, help }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={choice === value}
              onClick={() => setChoice(value)}
              className={cn(
                'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                choice === value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-muted',
              )}
            >
              <span className="font-medium">{label}</span>
              {help && (
                <span className="block text-xs text-muted-foreground">
                  {help}
                </span>
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={() => void apply()}
            isLoading={deleting || shift.busy}
            variant={choice === 'delete' ? 'destructive' : 'default'}
            data-unavailable-apply
          >
            {m.unavailable_review_apply()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
