import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { Cycle } from '@openathlete/shared';

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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update (non-blocking)
      queryClient.cancelQueries({
        queryKey: [cycleKeys.getMyCycles],
      });
      queryClient.cancelQueries({
        queryKey: [cycleKeys.getCycle, variables.cycleId],
      });

      // Snapshot all previous query states for rollback
      const previousQueries = new Map();
      queryClient
        .getQueriesData({ queryKey: [cycleKeys.getMyCycles] })
        .forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

      const previousCycle = queryClient.getQueryData<Cycle>([
        cycleKeys.getCycle,
        variables.cycleId,
      ]);

      // Optimistically update all getMyCycles queries (they can have different params)
      // This happens synchronously for instant UI feedback
      queryClient.setQueriesData<Cycle[]>(
        { queryKey: [cycleKeys.getMyCycles] },
        (old) => {
          if (!old) return old;
          const updateIndex = old.findIndex(
            (c) => c.cycleId === variables.cycleId,
          );

          if (updateIndex === -1) return old;

          const updatedCycles = [...old];
          updatedCycles[updateIndex] = {
            ...updatedCycles[updateIndex],
            ...variables.body,
            // Ensure dates are properly converted
            startDate: variables.body.startDate
              ? new Date(variables.body.startDate)
              : updatedCycles[updateIndex].startDate,
            endDate: variables.body.endDate
              ? new Date(variables.body.endDate)
              : updatedCycles[updateIndex].endDate,
          } as Cycle;
          return updatedCycles;
        },
      );

      // Optimistically update the single cycle query if it exists
      if (previousCycle) {
        queryClient.setQueryData<Cycle>(
          [cycleKeys.getCycle, variables.cycleId],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              ...variables.body,
              startDate: variables.body.startDate
                ? new Date(variables.body.startDate)
                : old.startDate,
              endDate: variables.body.endDate
                ? new Date(variables.body.endDate)
                : old.endDate,
            } as Cycle;
          },
        );
      }

      // Return context with previous values for rollback
      return { previousQueries, previousCycle };
    },
    onError: (_error, variables, context) => {
      // Rollback on error - restore all previous query states
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCycle) {
        queryClient.setQueryData(
          [cycleKeys.getCycle, variables.cycleId],
          context.previousCycle,
        );
      }
      // User's onError will be called via the spread ...opt
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      opt?.onSuccess?.(data, variables, onMutateResult, context);
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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      queryClient.cancelQueries({
        queryKey: [cycleKeys.getMyCycles],
      });
      queryClient.cancelQueries({
        queryKey: [cycleKeys.getCycle, variables],
      });

      // Snapshot all previous query states for rollback
      const previousQueries = new Map();
      queryClient
        .getQueriesData({ queryKey: [cycleKeys.getMyCycles] })
        .forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

      const previousCycle = queryClient.getQueryData<Cycle>([
        cycleKeys.getCycle,
        variables,
      ]);

      // Optimistically remove the cycle from all getMyCycles queries
      queryClient.setQueriesData<Cycle[]>(
        { queryKey: [cycleKeys.getMyCycles] },
        (old) => {
          if (!old) return old;
          return old.filter((c) => c.cycleId !== variables);
        },
      );

      // Optimistically remove the single cycle query if it exists
      if (previousCycle) {
        queryClient.removeQueries({
          queryKey: [cycleKeys.getCycle, variables],
        });
      }

      // Return context with previous values for rollback
      return { previousQueries, previousCycle };
    },
    onError: (_error, variables, context) => {
      // Rollback on error - restore all previous query states
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCycle) {
        queryClient.setQueryData(
          [cycleKeys.getCycle, variables],
          context.previousCycle,
        );
      }
      // User's onError will be called via the spread ...opt
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      // Invalidate to ensure we have the correct server data
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
