import { useAuthContext } from '@/contexts/auth';
import { getApiBaseUrl } from '@/utils/capacitor';
import { hasLocalZwift, localZwift } from '@/utils/zwift';
import { useQuery } from '@tanstack/react-query';

export function useZwiftConnection() {
  const { user } = useAuthContext();
  const binding = {
    apiBaseURL: getApiBaseUrl(),
    accountID: user ? String(user.userId) : '',
  };
  const available = hasLocalZwift() && Boolean(binding.accountID);
  const key = `${binding.apiBaseURL}|${binding.accountID}`;
  const query = useQuery({
    queryKey: ['localZwift', key],
    queryFn: () => localZwift.status(binding),
    enabled: available,
    retry: false,
    staleTime: 0,
  });
  return { available, binding, scope: key, query };
}
