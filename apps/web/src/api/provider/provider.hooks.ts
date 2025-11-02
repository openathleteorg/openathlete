import { MutationOptions, useMutation } from '@tanstack/react-query';

import { ProviderAPI } from './provider.api';

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
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};

export const useSetOAuthTokenMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ProviderAPI.setOAuthToken>>,
    Error,
    Parameters<typeof ProviderAPI.setOAuthToken>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: ProviderAPI.setOAuthToken,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};

