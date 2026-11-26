import {
  type AuthLoginAttempt,
  type AuthSessionSnapshot,
  beginAuthLogin,
  commitAuthLogin,
  isAuthLoginCurrent,
  storedAccessToken,
} from '@/utils/auth-attempt';
import { AuthSessionChangedError } from '@/utils/axios';
import { type MutationOptions, useMutation } from '@tanstack/react-query';

import { AuthResponseDto } from '@openathlete/shared';

import { AuthAPI } from './auth.api';

type LoginAttempt = AuthLoginAttempt | Promise<AuthLoginAttempt>;

type LoginRun<TVariables> = {
  variables: TVariables;
  attempt: LoginAttempt;
};

type LoginOptions<TVariables> = Omit<
  MutationOptions<AuthResponseDto, Error, TVariables>,
  'onSuccess'
> & {
  onSuccess?: (
    data: AuthResponseDto,
    variables: TVariables,
    isCurrent: () => boolean,
  ) => void | Promise<void>;
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
 * Direct logins capture the attempt when submitted. Multi-step flows pass the
 * attempt captured before their first asynchronous step.
 */
function useAuthLoginMutation<TVariables>(
  mutationFn: (
    variables: TVariables,
    session: AuthSessionSnapshot,
  ) => Promise<AuthResponseDto>,
  opt?: LoginOptions<TVariables>,
) {
  const mutation = useMutation<
    AuthResponseDto,
    Error,
    LoginRun<TVariables>,
    LoginContext
  >({
    ...opt,
    mutationFn: async ({ variables, attempt }) => {
      const started = await attempt;
      if (!isAuthLoginCurrent(started)) throw new AuthSessionChangedError();
      return mutationFn(variables, started);
    },
    onMutate: async (run, context) => {
      const result = opt?.onMutate
        ? await opt.onMutate(run.variables, context)
        : undefined;
      return { result };
    },
    onSuccess: async (data, { attempt, variables }) => {
      const started = await attempt;
      const session = await commitAuthLogin(
        started,
        data.accessToken,
        data.refreshToken,
      );
      if (!session) return;
      const isCurrent = () =>
        isAuthLoginCurrent(started, session) && storedAccessToken() !== null;
      if (isCurrent()) return opt?.onSuccess?.(data, variables, isCurrent);
    },
    onError: async (error, run, context, mutationContext) => {
      const started = await Promise.resolve(run.attempt).catch(() => null);
      if ((!started || isAuthLoginCurrent(started)) && opt?.onError)
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

  return {
    ...mutation,
    mutate: (variables: TVariables, attempt: LoginAttempt = beginAuthLogin()) =>
      mutation.mutate({ variables, attempt }),
    mutateAsync: (
      variables: TVariables,
      attempt: LoginAttempt = beginAuthLogin(),
    ) => mutation.mutateAsync({ variables, attempt }),
  };
}

export const useLoginMutation = (
  opt?: LoginOptions<Parameters<typeof AuthAPI.login>[0]>,
) => useAuthLoginMutation(AuthAPI.login, opt);

export const useLoginWithFirebaseMutation = (
  opt?: LoginOptions<Parameters<typeof AuthAPI.loginWithFirebase>[0]>,
) => useAuthLoginMutation(AuthAPI.loginWithFirebase, opt);

export const useExchangeOidcCodeMutation = (
  opt?: LoginOptions<Parameters<typeof AuthAPI.exchangeOidcCode>[0]>,
) => useAuthLoginMutation(AuthAPI.exchangeOidcCode, opt);
