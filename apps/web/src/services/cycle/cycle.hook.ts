import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { CycleService } from './cycle.service';

export const useCreateCycleMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CycleService.createCycle>>,
    Error,
    Parameters<typeof CycleService.createCycle>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CycleService.createCycle,
    onSuccess: (data, variables, context) => {
      if (opt?.onSuccess) opt.onSuccess(data, variables, context);
      queryClient.invalidateQueries({ queryKey: ['CycleService.getMyCycles'] });
    },
  });
};

export const useUpdateCycleMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CycleService.updateCycle>>,
    Error,
    Parameters<typeof CycleService.updateCycle>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CycleService.updateCycle,
    onSuccess: (data, variables, context) => {
      if (opt?.onSuccess) opt.onSuccess(data, variables, context);
      queryClient.invalidateQueries({
        queryKey: ['CycleService.getCycle', variables.cycleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['CycleService.getMyCycles'],
      });
    },
  });
};

export const useDeleteCycleMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CycleService.deleteCycle>>,
    Error,
    Parameters<typeof CycleService.deleteCycle>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CycleService.deleteCycle,
    onSuccess: (data, variables, context) => {
      if (opt?.onSuccess) opt.onSuccess(data, variables, context);
      queryClient.invalidateQueries({ queryKey: ['CycleService.getMyCycles'] });
    },
  });
};

export const useGetMyCyclesQuery = (
  isCoach?: boolean,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof CycleService.getMyCycles>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => CycleService.getMyCycles(isCoach, athleteId),
    queryKey: ['CycleService.getMyCycles', isCoach, athleteId],
  });

export const useGetCycleQuery = (
  cycleId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof CycleService.getCycle>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => CycleService.getCycle(cycleId),
    queryKey: ['CycleService.getCycle', cycleId],
  });
