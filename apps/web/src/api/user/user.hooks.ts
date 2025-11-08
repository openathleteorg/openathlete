import {
  MutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';

import { UserAPI } from './user.api';
import { userKeys } from './user.keys';

export const useCreateAccountMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof UserAPI.createAccount>>,
    Error,
    Parameters<typeof UserAPI.createAccount>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: UserAPI.createAccount,
  });
};

export const useUpdateAccountMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof UserAPI.updateAccount>>,
    Error,
    Parameters<typeof UserAPI.updateAccount>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: UserAPI.updateAccount,
  });
};

export const useCompleteOnboardingMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof UserAPI.completeOnboarding>>,
    Error,
    Parameters<typeof UserAPI.completeOnboarding>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: UserAPI.completeOnboarding,
  });
};

export const useGetMeQuery = (
  opt?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof UserAPI.getMe>>>,
    'queryKey' | 'queryFn'
  >,
) =>
  useQuery({
    ...opt,
    queryFn: UserAPI.getMe,
    queryKey: [userKeys.getMe],
  });

export const usePasswordResetRequestMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof UserAPI.passwordResetRequest>>,
    Error,
    Parameters<typeof UserAPI.passwordResetRequest>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: UserAPI.passwordResetRequest,
  });
};

export const usePasswordResetMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof UserAPI.passwordReset>>,
    Error,
    Parameters<typeof UserAPI.passwordReset>[0]
  >,
) => {
  return useMutation({
    ...opt,
    mutationFn: UserAPI.passwordReset,
  });
};
