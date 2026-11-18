import { eventKeys } from '@/api/event/event.keys';
import { trainingLoadKeys } from '@/api/training-load/training-load.keys';
import {
  MutationOptions,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  ActivityUploadWebhookCredentialsDto,
  ActivityUploadWebhookStatusDto,
  ImportedActivityDto,
  RemoveDuplicateActivitiesResponseDto,
  SPORT_TYPE,
} from '@openathlete/shared';

import { ActivityImportAPI } from './activity-import.api';

const webhookStatusKey = ['activity-import', 'webhook-connection'];

export function useActivityUploadWebhookQuery() {
  return useQuery({
    queryKey: webhookStatusKey,
    queryFn: ActivityImportAPI.getWebhookStatus,
  });
}

export function useGenerateActivityUploadWebhookMutation(
  showCredentials: (credentials: ActivityUploadWebhookCredentialsDto) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runGapSignature: boolean) => {
      const credentials = await ActivityImportAPI.generateWebhook({
        runGapSignature,
      });
      // Only component state gets the one-time credentials.
      showCredentials(credentials);
      return { enabled: true, runGapSignature };
    },
    onSuccess: (status) => {
      queryClient.setQueryData<ActivityUploadWebhookStatusDto>(
        webhookStatusKey,
        status,
      );
    },
  });
}

export function useRevokeActivityUploadWebhookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ActivityImportAPI.revokeWebhook,
    onSuccess: () => {
      queryClient.setQueryData<ActivityUploadWebhookStatusDto>(
        webhookStatusKey,
        {
          enabled: false,
          runGapSignature: false,
        },
      );
    },
  });
}

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

export function useImportTcxMutation() {
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
    }) => ActivityImportAPI.importTcx(file, name, sport),
    onSuccess: (result) => refreshImported(queryClient, result),
  });
}

/**
 * The removal runs in the background: the calendar refreshes when the API
 * announces the deletions over its websocket.
 */
export function useRemoveDuplicateActivitiesMutation(
  opt?: MutationOptions<RemoveDuplicateActivitiesResponseDto, Error, void>,
) {
  return useMutation({
    ...opt,
    mutationFn: () => ActivityImportAPI.removeDuplicates(),
  });
}
