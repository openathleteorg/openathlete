import { getApiBaseUrl } from '@/utils/capacitor';
import { useInfiniteQuery } from '@tanstack/react-query';

import { ActivityReviewAPI } from './activity-review.api';

export function useActivityReviewsQuery(userId: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['activity-reviews', getApiBaseUrl(), userId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => ActivityReviewAPI.list(pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled,
    refetchInterval: enabled ? 15000 : false,
  });
}
