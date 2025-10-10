import { ACCESS_TOKEN, REFRESH_TOKEN, setItem } from '@/utils/local-storage';
import { MutationOptions, useMutation } from '@tanstack/react-query';

import { AuthService } from './auth.service';

export const useLoginMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AuthService.login>>,
    Error,
    Parameters<typeof AuthService.login>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: AuthService.login,
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
    Awaited<ReturnType<typeof AuthService.emailExists>>,
    Error,
    Parameters<typeof AuthService.emailExists>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: AuthService.emailExists,
  });
};
