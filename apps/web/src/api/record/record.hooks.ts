import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  GetRecordEffortsQueryDto,
  GetRecordHistoryQueryDto,
  GetRecordsQueryDto,
} from '@openathlete/shared';

import { RecordAPI } from './record.api';
import { recordKeys } from './record.keys';

export const useGetRecordsQuery = (
  query: GetRecordsQueryDto,
  {
    enabled = true,
    keepPrevious = false,
  }: { enabled?: boolean; keepPrevious?: boolean } = {},
) =>
  useQuery({
    queryFn: () => RecordAPI.getRecords(query),
    queryKey: [
      recordKeys.getRecords,
      query.sport,
      query.athleteId,
      query.from?.toISOString(),
      query.to?.toISOString(),
    ],
    enabled,
    ...(keepPrevious && { placeholderData: keepPreviousData }),
  });

export const useGetRecordSportsQuery = (athleteId?: number) =>
  useQuery({
    queryFn: () => RecordAPI.getRecordSports(athleteId),
    queryKey: [recordKeys.getRecordSports, athleteId],
  });

export const useGetRecordHistoryQuery = (
  query: Partial<GetRecordHistoryQueryDto>,
) =>
  useQuery({
    queryFn: () =>
      RecordAPI.getRecordHistory(query as GetRecordHistoryQueryDto),
    queryKey: [recordKeys.getRecordHistory, query.sport, query.athleteId],
    enabled: !!query.sport,
    placeholderData: keepPreviousData,
  });

export const useGetRecordEffortsQuery = (
  query: GetRecordEffortsQueryDto | null,
) =>
  useQuery({
    queryFn: () => RecordAPI.getRecordEfforts(query!),
    queryKey: [
      recordKeys.getRecordEfforts,
      query?.sport,
      query?.athleteId,
      query?.type,
      query?.distance,
      query?.duration,
    ],
    enabled: query !== null,
  });

export const useGetRecordExclusionsQuery = (
  query: Partial<GetRecordHistoryQueryDto>,
) =>
  useQuery({
    queryFn: () =>
      RecordAPI.getRecordExclusions(query as GetRecordHistoryQueryDto),
    queryKey: [recordKeys.getRecordExclusions, query.sport, query.athleteId],
    enabled: !!query.sport,
  });

/** Records feed the page, the training paces and the statistics alike. */
const useInvalidateRecords = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        typeof queryKey[0] === 'string' &&
        queryKey[0].startsWith(recordKeys.root),
    });
};

export const useCreateRecordExclusionMutation = () => {
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: RecordAPI.createRecordExclusion,
    onSuccess: invalidate,
  });
};

export const useDeleteRecordExclusionMutation = () => {
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: RecordAPI.deleteRecordExclusion,
    onSuccess: invalidate,
  });
};
