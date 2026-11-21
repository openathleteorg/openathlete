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
  WebhookConnector,
} from '@openathlete/shared';

import { ActivityImportAPI } from './activity-import.api';

const webhookStatusKey = (connector: WebhookConnector) => [
  'activity-import',
  'webhook-connection',
  connector,
];

export function useActivityUploadWebhookQuery(connector: WebhookConnector) {
  return useQuery({
    queryKey: webhookStatusKey(connector),
    queryFn: () => ActivityImportAPI.getWebhookStatus(connector),
  });
}

export function useGenerateActivityUploadWebhookMutation(
  connector: WebhookConnector,
  showCredentials: (credentials: ActivityUploadWebhookCredentialsDto) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const credentials = await ActivityImportAPI.generateWebhook(connector);
      // Only component state gets the one-time credentials.
      showCredentials(credentials);
      return { enabled: true };
    },
    onSuccess: (status) => {
      queryClient.setQueryData<ActivityUploadWebhookStatusDto>(
        webhookStatusKey(connector),
        status,
      );
    },
  });
}

export function useRevokeActivityUploadWebhookMutation(
  connector: WebhookConnector,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ActivityImportAPI.revokeWebhook(connector),
    onSuccess: () => {
      queryClient.setQueryData<ActivityUploadWebhookStatusDto>(
        webhookStatusKey(connector),
        {
          enabled: false,
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
