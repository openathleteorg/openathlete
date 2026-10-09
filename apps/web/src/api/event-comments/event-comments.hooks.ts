import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EventCommentsAPI } from './event-comments.api';

export const eventCommentKeys = {
  all: ['event-comments'] as const,
  counts: (start?: string, end?: string, athleteId?: number) =>
    [...eventCommentKeys.all, 'counts', start, end, athleteId] as const,
  list: (eventId: number) =>
    [...eventCommentKeys.all, 'list', eventId] as const,
};

/** Comment and unread counts of the events of a calendar range */
export const useEventCommentCountsQuery = ({
  startDate,
  endDate,
  athleteId,
  enabled = true,
}: {
  startDate?: Date;
  endDate?: Date;
  athleteId?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: eventCommentKeys.counts(
      startDate?.toISOString(),
      endDate?.toISOString(),
      athleteId,
    ),
    queryFn: () => EventCommentsAPI.getCounts(startDate!, endDate!, athleteId),
    enabled: enabled && Boolean(startDate && endDate),
    // New comments come from others: check now and then
    refetchInterval: 60_000,
  });

export const useEventCommentsQuery = (eventId: number) =>
  useQuery({
    queryKey: eventCommentKeys.list(eventId),
    queryFn: () => EventCommentsAPI.list(eventId),
  });

/** Counts and lists change together after any comment or read */
const useInvalidateComments = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: eventCommentKeys.all });
};

export const useAddEventCommentMutation = (eventId: number) => {
  const invalidate = useInvalidateComments();
  return useMutation({
    mutationFn: (content: string) => EventCommentsAPI.add(eventId, content),
    onSuccess: invalidate,
  });
};

export const useMarkEventCommentsReadMutation = (eventId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => EventCommentsAPI.markRead(eventId),
    // Only the counts change: the list on screen stays as it is
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...eventCommentKeys.all, 'counts'],
      }),
  });
};
