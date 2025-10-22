import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { CycleAPI } from './cycle.api';
import { cycleKeys } from './cycle.keys';

export const useCreateCycleMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CycleAPI.createCycle>>,
    Error,
    Parameters<typeof CycleAPI.createCycle>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CycleAPI.createCycle,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [cycleKeys.getMyCycles] });
    },
  });
};

export const useUpdateCycleMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CycleAPI.updateCycle>>,
    Error,
    Parameters<typeof CycleAPI.updateCycle>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CycleAPI.updateCycle,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [cycleKeys.getCycle, variables.cycleId],
      });
      queryClient.invalidateQueries({
        queryKey: [cycleKeys.getMyCycles],
      });
    },
  });
};

export const useDeleteCycleMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CycleAPI.deleteCycle>>,
    Error,
    Parameters<typeof CycleAPI.deleteCycle>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CycleAPI.deleteCycle,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [cycleKeys.getMyCycles] });
    },
  });
};

export const useGetMyCyclesQuery = (
  isCoach?: boolean,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof CycleAPI.getMyCycles>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => CycleAPI.getMyCycles(isCoach, athleteId),
    queryKey: [cycleKeys.getMyCycles, isCoach, athleteId],
  });

export const useGetCycleQuery = (
  cycleId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof CycleAPI.getCycle>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => CycleAPI.getCycle(cycleId),
    queryKey: [cycleKeys.getCycle, cycleId],
  });
