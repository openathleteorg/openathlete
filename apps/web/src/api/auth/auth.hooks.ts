import {
  type AuthLoginAttempt,
  beginAuthLogin,
  commitAuthLogin,
} from '@/utils/auth-attempt';
import { type MutationOptions, useMutation } from '@tanstack/react-query';

import { AuthResponseDto } from '@openathlete/shared';

import { AuthAPI } from './auth.api';

type LoginRun<TVariables> = {
  variables: TVariables;
  attempt: AuthLoginAttempt;
};

type LoginContext = {
  /** Whatever the caller's own onMutate returned. */
  result: unknown;
};

/**
 * A login response may only install its tokens while it is still the newest
 * login started on this storage. Two submissions, or a reload in another tab,
 * must never make the older answer overwrite the session that won.
 *
 * The attempt is captured when `mutate`/`mutateAsync` is called, not when the
 * async mutation runner starts: another login may commit in between.
 */
function useAuthLoginMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<AuthResponseDto>,
  opt?: MutationOptions<AuthResponseDto, Error, TVariables>,
) {
  const mutation = useMutation<
    AuthResponseDto,
    Error,
    LoginRun<TVariables>,
    LoginContext
  >({
    ...opt,
    mutationFn: (run) => mutationFn(run.variables),
    onMutate: async (run, context) => {
      const result = opt?.onMutate
        ? await opt.onMutate(run.variables, context)
        : undefined;
      return { result };
    },
    onSuccess: (data, run, context, mutationContext) => {
      if (!commitAuthLogin(run.attempt, data.accessToken, data.refreshToken)) {
        return;
      }
      if (opt?.onSuccess)
        return opt.onSuccess(
          data,
          run.variables,
          context.result,
          mutationContext,
        );
    },
    onError: (error, run, context, mutationContext) => {
      if (opt?.onError)
        return opt.onError(
          error,
          run.variables,
          context?.result,
          mutationContext,
        );
    },
    onSettled: (data, error, run, context, mutationContext) => {
      if (opt?.onSettled)
        return opt.onSettled(
          data,
          error,
          run.variables,
          context?.result,
          mutationContext,
        );
    },
  });

  const run = (variables: TVariables): LoginRun<TVariables> => ({
    variables,
    attempt: beginAuthLogin(),
  });

  return {
    ...mutation,
    mutate: (
      variables: TVariables,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate(run(variables), options),
    mutateAsync: (
      variables: TVariables,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync(run(variables), options),
  };
}

export const useLoginMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AuthAPI.login>>,
    Error,
    Parameters<typeof AuthAPI.login>[0]
  >,
) => useAuthLoginMutation(AuthAPI.login, opt);

export const useLoginWithFirebaseMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AuthAPI.loginWithFirebase>>,
    Error,
    Parameters<typeof AuthAPI.loginWithFirebase>[0]
  >,
) => useAuthLoginMutation(AuthAPI.loginWithFirebase, opt);

export const useExchangeOidcCodeMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AuthAPI.exchangeOidcCode>>,
    Error,
    Parameters<typeof AuthAPI.exchangeOidcCode>[0]
  >,
) => useAuthLoginMutation(AuthAPI.exchangeOidcCode, opt);
