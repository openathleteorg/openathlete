import { eventKeys } from '@/api/event/event.keys';
import { trainingLoadKeys } from '@/api/training-load/training-load.keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ActivityImportAPI } from './activity-import.api';

export function useImportFitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) =>
      ActivityImportAPI.importFit(file, name),
    onSuccess: (result) =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] }),
        queryClient.invalidateQueries({
          queryKey: [eventKeys.getEventStream, result.eventId],
        }),
        queryClient.invalidateQueries({
          queryKey: [trainingLoadKeys.getWeeklyLoadSummary],
        }),
      ]),
  });
}
