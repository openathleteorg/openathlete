import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { ConnectorProvider } from '@openathlete/shared';

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
    onSuccess: () => {
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
    onSuccess: () => {
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
  });
};
