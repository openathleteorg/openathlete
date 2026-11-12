import { getLocale } from '@/paraglide/runtime';
import {
  type MutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { eventKeys } from '../event/event.keys';
import { trainingLoadKeys } from '../training-load/training-load.keys';
import { ExerciseAPI } from './exercise.api';
import { exerciseKeys } from './exercise.keys';

export const useExerciseCatalogQuery = () => {
  const locale = getLocale();
  return useQuery({
    queryKey: [exerciseKeys.catalog, locale],
    queryFn: () => ExerciseAPI.getCatalog(locale),
    // Shipped with the app: it changes with a release only
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useCustomExercisesQuery = () =>
  useQuery({
    queryKey: [exerciseKeys.custom],
    queryFn: ExerciseAPI.getCustom,
  });

function useCustomMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  opt?: MutationOptions<TResult, Error, TArgs>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: [exerciseKeys.custom] });
      opt?.onSuccess?.(...args);
    },
  });
}

export const useCreateCustomExerciseMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ExerciseAPI.createCustom>>,
    Error,
    Parameters<typeof ExerciseAPI.createCustom>[0]
  >,
) => useCustomMutation(ExerciseAPI.createCustom, opt);

export const useUpdateCustomExerciseMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ExerciseAPI.updateCustom>>,
    Error,
    Parameters<typeof ExerciseAPI.updateCustom>[0]
  >,
) => useCustomMutation(ExerciseAPI.updateCustom, opt);

export const useDeleteCustomExerciseMutation = (
  opt?: MutationOptions<void, Error, number>,
) => useCustomMutation(ExerciseAPI.deleteCustom, opt);

export const useCompleteStrengthSessionMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof ExerciseAPI.completeStrengthSession>>,
    Error,
    Parameters<typeof ExerciseAPI.completeStrengthSession>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ExerciseAPI.completeStrengthSession,
    onSuccess: (...args) => {
      // The session is done: the calendar, the session and the load change
      void queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      void queryClient.invalidateQueries({ queryKey: [eventKeys.getEvent] });
      void queryClient.invalidateQueries({ queryKey: [trainingLoadKeys.root] });
      opt?.onSuccess?.(...args);
    },
  });
};
