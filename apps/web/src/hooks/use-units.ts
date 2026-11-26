import { useGetMeQuery } from '@/api/user';
import { AuthContext } from '@/contexts/auth/context/auth-context';
import { Units, unitsFor } from '@/utils/units';
import { useContext, useMemo } from 'react';

/**
 * The signed-in user's units. The session's user answers until the query
 * does, so an imperial user does not see kilometres first. Signed out,
 * nothing is fetched and values read in metric units.
 */
export function useUnits(): Units {
  const session = useContext(AuthContext);
  const { data: me } = useGetMeQuery({ enabled: Boolean(session?.user) });
  const unitSystem = me?.unitSystem ?? session?.user?.unitSystem ?? 'METRIC';
  return useMemo(() => unitsFor(unitSystem), [unitSystem]);
}
