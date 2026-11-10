import { useGetMeQuery } from '@/api/user';
import { AuthContext } from '@/contexts/auth/context/auth-context';
import { Units, unitsFor } from '@/utils/units';
import { useContext, useMemo } from 'react';

/**
 * The signed-in user's units. The session's user answers until the query
 * does, so an imperial user does not see kilometres first.
 */
export function useUnits(): Units {
  const { data: me } = useGetMeQuery();
  const session = useContext(AuthContext);
  const unitSystem = me?.unitSystem ?? session?.user?.unitSystem ?? 'METRIC';
  return useMemo(() => unitsFor(unitSystem), [unitSystem]);
}
