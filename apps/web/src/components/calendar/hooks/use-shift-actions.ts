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

  const move = (eventIds: Event['eventId'][], offsetDays: number) =>
    moveMutation.mutate(
      { eventIds, offsetDays },
      {
        onSuccess: (moved) =>
          toast.success(m.calendar_week_moved({ count: moved.length }), {
            action: {
              label: m.calendar_link_undo(),
              onClick: () =>
                moveMutation.mutate(
                  { eventIds, offsetDays: -offsetDays },
                  { onError: failed },
                ),
            },
          }),
        onError: failed,
      },
    );

  const copy = (eventIds: Event['eventId'][], offsetDays: number) =>
    copyMutation.mutate(
      { eventIds, offsetDays },
      {
        onSuccess: (copies) =>
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
          }),
        onError: failed,
      },
    );

  return {
    move,
    copy,
    busy: copyMutation.isPending || moveMutation.isPending,
  };
}
