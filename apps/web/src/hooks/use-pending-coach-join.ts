import {
  CoachJoinLinkAPI,
  invalidateAfterCoachJoin,
} from '@/api/coach-join-link';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import {
  forgetCoachJoinToken,
  readPendingCoachJoinToken,
} from '@/utils/coach-join';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { AcceptCoachJoinLinkResponseDto } from '@openathlete/shared';

/** The toast for a join link the API refused, or null for a network error */
export function coachJoinErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error) || !error.response) return null;
  const { status, data } = error.response;
  const message = String(
    (data as { message?: unknown } | undefined)?.message ?? '',
  );
  if (status === 404) return m.join_link_invalid_title();
  if (status === 400 && message.includes('maximum number of athletes')) {
    return m.join_link_limit_reached();
  }
  if (status === 400 && message.includes('own link')) {
    return m.join_link_own_link();
  }
  if (status >= 400 && status < 500) return m.join_link_accept_failed();
  return null;
}

export function toastCoachJoined(result: AcceptCoachJoinLinkResponseDto) {
  if (result.alreadyLinked) {
    toast.info(m.join_link_already_joined({ coach: result.coachName }));
  } else {
    toast.success(m.join_link_joined({ coach: result.coachName }));
  }
}

// One request per token for the whole app: StrictMode, remounts and the
// onboarding redirect must not submit it twice
let inFlight: string | null = null;

/**
 * Spends a join link opened before signing in. Mounted in the dashboard
 * layout, so it also runs on the onboarding page where new accounts land.
 * The token is forgotten on success or when the API refuses it (4xx), and
 * kept for the next visit after a network or server error.
 */
export function usePendingCoachJoin() {
  const { authenticated } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authenticated) return;
    const token = readPendingCoachJoinToken();
    if (!token || inFlight === token) return;
    inFlight = token;

    CoachJoinLinkAPI.accept(token)
      .then(async (result) => {
        forgetCoachJoinToken();
        toastCoachJoined(result);
        await invalidateAfterCoachJoin(queryClient);
      })
      .catch((error: unknown) => {
        const message = coachJoinErrorMessage(error);
        if (message) {
          forgetCoachJoinToken();
          toast.error(message);
        }
      })
      .finally(() => {
        inFlight = null;
      });
  }, [authenticated, queryClient]);
}
