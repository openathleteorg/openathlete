/**
 * A club join link opened while signed out: the token waits in localStorage
 * through sign-up or login, and the dashboard spends it once the user is
 * signed in (usePendingClubJoin). The page they opened showed the club and
 * its staff before they chose to create an account.
 */
export const CLUB_JOIN_TOKEN_STORAGE_KEY = 'openathlete-pending-club-join';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function rememberClubJoinToken(token: string) {
  if (!TOKEN_PATTERN.test(token)) return;
  try {
    localStorage.setItem(CLUB_JOIN_TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage blocked: the user can open the link again once signed in
  }
}

export function readPendingClubJoinToken(): string | null {
  try {
    const token = localStorage.getItem(CLUB_JOIN_TOKEN_STORAGE_KEY);
    return token && TOKEN_PATTERN.test(token) ? token : null;
  } catch {
    return null;
  }
}

export function forgetClubJoinToken() {
  try {
    localStorage.removeItem(CLUB_JOIN_TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to forget when storage is blocked
  }
}
