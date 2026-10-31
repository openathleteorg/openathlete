import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { reportError } from './error-monitoring';

// HTTP failures are reported by the API; what remains is a bug in the client,
// which React Query would otherwise swallow
const reportClientError = (error: unknown) => {
  if (!isAxiosError(error)) reportError(error);
};

/**
 * The app's single React Query cache, shared with the auth provider, which
 * sits outside QueryClientProvider and empties it on logout.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportClientError }),
  mutationCache: new MutationCache({ onError: reportClientError }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache is kept for 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
});
