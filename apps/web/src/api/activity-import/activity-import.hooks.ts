import { eventKeys } from '@/api/event/event.keys';
import { trainingLoadKeys } from '@/api/training-load/training-load.keys';
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { ImportedActivityDto, SPORT_TYPE } from '@openathlete/shared';

import { ActivityImportAPI } from './activity-import.api';

const refreshImported = (
  queryClient: QueryClient,
  result: ImportedActivityDto,
) =>
  Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] }),
    queryClient.invalidateQueries({
      queryKey: [eventKeys.getEventStream, result.eventId],
    }),
    queryClient.invalidateQueries({
      queryKey: [trainingLoadKeys.getWeeklyLoadSummary],
    }),
  ]);

export function useImportFitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) =>
      ActivityImportAPI.importFit(file, name),
    onSuccess: (result) => refreshImported(queryClient, result),
  });
}

export function useImportGpxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      name,
      sport,
    }: {
      file: File;
      name: string;
      sport?: SPORT_TYPE;
    }) => ActivityImportAPI.importGpx(file, name, sport),
    onSuccess: (result) => refreshImported(queryClient, result),
  });
}
