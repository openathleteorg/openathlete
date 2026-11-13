/**
 * A coach join link opened while signed out: the token waits in localStorage
 * through sign-up or login (OAuth, email confirmation, another tab), and the
 * dashboard spends it once the user is signed in (usePendingCoachJoin).
 */
export const COACH_JOIN_TOKEN_STORAGE_KEY = 'openathlete-pending-coach-join';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function rememberCoachJoinToken(token: string) {
  if (!TOKEN_PATTERN.test(token)) return;
  try {
    localStorage.setItem(COACH_JOIN_TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage blocked: the user can open the link again once signed in
  }
}

/** The token of a join link opened before signing in, if any. */
export function readPendingCoachJoinToken(): string | null {
  try {
    const token = localStorage.getItem(COACH_JOIN_TOKEN_STORAGE_KEY);
    return token && TOKEN_PATTERN.test(token) ? token : null;
  } catch {
    return null;
  }
}

export function forgetCoachJoinToken() {
  try {
    localStorage.removeItem(COACH_JOIN_TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to forget when storage is blocked
  }
}
