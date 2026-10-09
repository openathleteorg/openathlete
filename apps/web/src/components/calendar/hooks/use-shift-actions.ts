import {
  EventAPI,
  useCopyEventsMutation,
  useMoveEventsMutation,
} from '@/api/event';
import { eventKeys } from '@/api/event/event.keys';
import { invalidateTrainingLoadQueries } from '@/api/training-load/training-load.keys';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Event } from '@openathlete/shared';

import { deleteWorkoutsSequentially } from '../utils/bulk-delete';

/**
 * Copies or moves planned events by whole days, each with an Undo in its
 * toast: a move goes back, copies are deleted. Shared by the week menu and
 * the selection bar.
 */
export function useShiftActions() {
  const queryClient = useQueryClient();
  const copyMutation = useCopyEventsMutation();
  const moveMutation = useMoveEventsMutation();
  const failed = () => toast.error(m.calendar_week_action_failed());

  // mutateAsync, not mutate: the toast and its Undo must survive a caller
  // that unmounts before the request ends (a dialog closing on submit)
  const move = async (eventIds: Event['eventId'][], offsetDays: number) => {
    try {
      const moved = await moveMutation.mutateAsync({ eventIds, offsetDays });
      toast.success(m.calendar_week_moved({ count: moved.length }), {
        action: {
          label: m.calendar_link_undo(),
          onClick: () =>
            moveMutation
              .mutateAsync({ eventIds, offsetDays: -offsetDays })
              .catch(failed),
        },
      });
    } catch {
      failed();
    }
  };

  const copy = async (eventIds: Event['eventId'][], offsetDays: number) => {
    try {
      const copies = await copyMutation.mutateAsync({ eventIds, offsetDays });
      toast.success(m.calendar_week_pasted({ count: copies.length }), {
        action: {
          label: m.calendar_link_undo(),
          onClick: async () => {
            await deleteWorkoutsSequentially(
              copies.map((event) => event.eventId),
              EventAPI.deleteEvent,
            );
            queryClient.invalidateQueries({
              queryKey: [eventKeys.getMyEvents],
            });
            invalidateTrainingLoadQueries(queryClient);
          },
        },
      });
    } catch {
      failed();
    }
  };

  return {
    move,
    copy,
    busy: copyMutation.isPending || moveMutation.isPending,
  };
}
