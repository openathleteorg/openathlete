import { ACCESS_TOKEN, REFRESH_TOKEN, setItem } from '@/utils/local-storage';
import { MutationOptions, useMutation } from '@tanstack/react-query';

import { AuthAPI } from './auth.api';

export const useLoginMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AuthAPI.login>>,
    Error,
    Parameters<typeof AuthAPI.login>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: AuthAPI.login,
    onSuccess: (data, variables, onMutateResult, context) => {
      setItem(REFRESH_TOKEN, data.refreshToken);
      setItem(ACCESS_TOKEN, data.accessToken);
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
    },
  });
};

export const useEmailExistsMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AuthAPI.emailExists>>,
    Error,
    Parameters<typeof AuthAPI.emailExists>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: AuthAPI.emailExists,
  });
};
