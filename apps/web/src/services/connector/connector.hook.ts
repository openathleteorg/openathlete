import { MutationOptions, useMutation } from '@tanstack/react-query';

import { ConnectorService } from './connector.service';

export const useGetOAuthUriMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ConnectorService.getOAuthUri>>,
    Error,
    Parameters<typeof ConnectorService.getOAuthUri>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: ConnectorService.getOAuthUri,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};

export const useSetOAuthTokenMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ConnectorService.setOAuthToken>>,
    Error,
    Parameters<typeof ConnectorService.setOAuthToken>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: ConnectorService.setOAuthToken,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};
