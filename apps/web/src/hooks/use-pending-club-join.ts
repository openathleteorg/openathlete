import { ClubAPI, invalidateAfterClubChange } from '@/api/club';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import {
  forgetClubJoinToken,
  readPendingClubJoinToken,
} from '@/utils/club-join';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { AcceptClubJoinLinkResponseDto } from '@openathlete/shared';

export function toastClubJoined(result: AcceptClubJoinLinkResponseDto) {
  if (result.alreadyMember) {
    toast.info(m.club_join_already_member({ club: result.clubName }));
  } else {
    toast.success(m.club_join_joined({ club: result.clubName }));
  }
}

/** The toast for a link the API refused, or null for a network error */
export function clubJoinErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error) || !error.response) return null;
  const { status } = error.response;
  if (status === 404) return m.join_link_invalid_title();
  if (status >= 400 && status < 500) return m.club_join_failed();
  return null;
}

// One request per token for the whole app: StrictMode and remounts must not
// submit it twice
let inFlight: string | null = null;

/**
 * Spends a club link opened before signing in, as usePendingCoachJoin does
 * for a coach's link. Kept after a network or server error, for next time.
 */
export function usePendingClubJoin() {
  const { authenticated, initialize } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authenticated) return;
    const token = readPendingClubJoinToken();
    if (!token || inFlight === token) return;
    inFlight = token;

    ClubAPI.acceptJoin(token)
      .then(async (result) => {
        forgetClubJoinToken();
        toastClubJoined(result);
        // Joining as a coach adds the coach role
        if (result.role !== 'ATHLETE') await initialize();
        await invalidateAfterClubChange(queryClient);
      })
      .catch((error: unknown) => {
        const message = clubJoinErrorMessage(error);
        if (message) {
          forgetClubJoinToken();
          toast.error(message);
        }
      })
      .finally(() => {
        inFlight = null;
      });
  }, [authenticated, initialize, queryClient]);
}
