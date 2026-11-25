import { UserAPI } from '@/api/user/user.api';
import { userKeys } from '@/api/user/user.keys';
import { AuthContext } from '@/contexts/auth/context/auth-context';
import { Units, unitsFor } from '@/utils/units';
import {
  QueryClient,
  QueryClientContext,
  useQuery,
} from '@tanstack/react-query';
import { useContext, useMemo } from 'react';

const fallbackQueryClient = new QueryClient();

/**
 * The signed-in user's units. The session's user answers until the query
 * does, so an imperial user does not see kilometres first.
 */
export function useUnits(): Units {
  const queryClient = useContext(QueryClientContext);
  const session = useContext(AuthContext);
  const { data: me } = useQuery(
    {
      queryKey: [userKeys.getMe],
      queryFn: UserAPI.getMe,
      enabled: Boolean(queryClient && session?.user),
    },
    queryClient ?? fallbackQueryClient,
  );
  const unitSystem = me?.unitSystem ?? session?.user?.unitSystem ?? 'METRIC';
  return useMemo(() => unitsFor(unitSystem), [unitSystem]);
}
