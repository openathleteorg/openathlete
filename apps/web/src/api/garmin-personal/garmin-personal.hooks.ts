import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

import { GarminPersonalStatus } from '@openathlete/shared';

import { GarminPersonalAPI } from './garmin-personal.api';
import { garminPersonalKeys } from './garmin-personal.keys';

export function personalPollingInterval(
  status: GarminPersonalStatus['status'] | undefined,
  queuedForMs: number,
) {
  if (status === 'running') return 3000;
  if (status !== 'queued' || queuedForMs >= 120000) return false;
  return queuedForMs < 15000 ? 3000 : 15000;
}

export function useGarminPersonalStatus(userId: number) {
  const queuedAt = useRef<number | null>(null);
  const query = useQuery({
    queryKey: garminPersonalKeys.status(userId),
    queryFn: GarminPersonalAPI.status,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status !== 'queued') queuedAt.current = null;
      else queuedAt.current ??= Date.now();
      return personalPollingInterval(
        status,
        queuedAt.current === null ? 0 : Date.now() - queuedAt.current,
      );
    },
  });
  return {
    ...query,
    restartPolling: () => {
      queuedAt.current = null;
    },
  };
}
