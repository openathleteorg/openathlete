import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  ActivityDescriptionPreviewQueryDto,
  ConnectorProvider,
  ProviderPreferencesDto,
  isFullImportInProgress,
} from '@openathlete/shared';

import { ConnectedProvider, ProviderAPI } from './provider.api';
import { providerKeys } from './provider.keys';

export const useGetOAuthUriMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ProviderAPI.getOAuthUri>>,
    Error,
    Parameters<typeof ProviderAPI.getOAuthUri>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: ProviderAPI.getOAuthUri,
  });
};

export const useSetOAuthTokenMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ProviderAPI.setOAuthToken>>,
    Error,
    Parameters<typeof ProviderAPI.setOAuthToken>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ProviderAPI.setOAuthToken,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [providerKeys.getConnected] });
    },
  });
};

export const useDisconnectProviderMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ProviderAPI.disconnect>>,
    Error,
    ConnectorProvider
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: (provider: ConnectorProvider) =>
      ProviderAPI.disconnect(provider),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [providerKeys.getConnected] });
    },
  });
};

export const useGetConnectedProvidersQuery = (
  opt?: QueryOptions<ConnectedProvider[]>,
) => {
  return useQuery({
    ...opt,
    queryKey: [providerKeys.getConnected],
    queryFn: ProviderAPI.getConnectedProviders,
    // Historical imports run in the background: follow them until done
    refetchInterval: (query) =>
      query.state.data?.some((provider) => isFullImportInProgress(provider))
        ? 15_000
        : false,
  });
};

export const useActivityDescriptionPreviewQuery = (
  params: ActivityDescriptionPreviewQueryDto,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [providerKeys.activityDescriptionPreview, params],
    queryFn: () => ProviderAPI.getActivityDescriptionPreview(params),
    enabled,
  });
};

export const useUpdateProviderPreferencesMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ProviderAPI.updatePreferences>>,
    Error,
    { provider: ConnectorProvider; payload: ProviderPreferencesDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ provider, payload }) =>
      ProviderAPI.updatePreferences(provider, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess) {
        opt.onSuccess(data, variables, onMutateResult, context);
      }
      queryClient.invalidateQueries({ queryKey: [providerKeys.getConnected] });
      queryClient.invalidateQueries({
        queryKey: [providerKeys.activityDescriptionPreview],
      });
    },
  });
};

export const useImportAllActivitiesMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ProviderAPI.importAllActivities>>,
    Error,
    ConnectorProvider
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: (provider: ConnectorProvider) =>
      ProviderAPI.importAllActivities(provider),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess) {
        opt.onSuccess(data, variables, onMutateResult, context);
      }
      queryClient.invalidateQueries({ queryKey: [providerKeys.getConnected] });
    },
  });
};
