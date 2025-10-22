import { MutationOptions, useMutation } from '@tanstack/react-query';

import { ConnectorAPI } from './connector.api';

export const useGetOAuthUriMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ConnectorAPI.getOAuthUri>>,
    Error,
    Parameters<typeof ConnectorAPI.getOAuthUri>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: ConnectorAPI.getOAuthUri,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};

export const useSetOAuthTokenMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ConnectorAPI.setOAuthToken>>,
    Error,
    Parameters<typeof ConnectorAPI.setOAuthToken>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: ConnectorAPI.setOAuthToken,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};
