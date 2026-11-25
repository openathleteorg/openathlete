import axios from 'axios';

import {
  type AuthSessionSnapshot,
  authTokenGeneration,
  captureAuthSession,
  isAuthSessionCurrent,
  rotateAuthTokens,
} from './auth-attempt';
import { routes } from './axios';
import { getApiBaseUrl } from './capacitor';
import { ACCESS_TOKEN, REFRESH_TOKEN, getItem } from './local-storage';

function decodeJWT(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );
    return decoded;
  } catch {
    return null;
  }
}

type TokenInfo = {
  accessToken: string;
  refreshed: boolean;
} & (
  | {
      refreshed: true;
      refreshToken: string;
    }
  | {
      refreshed: false;
      refreshToken?: never;
    }
);

/**
 * Refresh the stored session. A response is installed only if no newer token
 * was installed and the same refresh token is still stored; otherwise a slow
 * refresh for account A could overwrite account B's freshly installed bearer.
 */
export async function refreshToken(
  expected: AuthSessionSnapshot = captureAuthSession(),
): Promise<TokenInfo | null> {
  if (!isAuthSessionCurrent(expected)) return null;
  const token = getItem(REFRESH_TOKEN);
  if (!token) return null;
  const startGeneration = authTokenGeneration();

  try {
    const tokenData = await axios.post(
      `${getApiBaseUrl()}${routes.auth.refreshToken}`,
      {
        refreshToken: token,
      },
    );

    if (!tokenData.data) return null;
    const { accessToken, refreshToken } = tokenData.data;
    if (
      !isAuthSessionCurrent(expected) ||
      authTokenGeneration() !== startGeneration ||
      getItem(REFRESH_TOKEN) !== token
    ) {
      // A newer session won, or the same owner already rotated this
      // credential. Never install its predecessor over it.
      return null;
    }
    if (!rotateAuthTokens(expected, accessToken, refreshToken)) return null;
    return {
      accessToken,
      refreshToken,
      refreshed: true,
    };
  } catch {
    return null;
  }
}

export function isValidToken(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return false;
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * Check if a token will expire within the specified number of minutes
 * @param token The JWT token to check
 * @param minutesBeforeExpiry Number of minutes before expiry to consider as "expiring soon" (default: 5)
 * @returns true if the token will expire within the specified time
 */
export function isTokenExpiringSoon(
  token: string,
  minutesBeforeExpiry: number = 5,
): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const threshold = minutesBeforeExpiry * 60 * 1000; // Convert minutes to milliseconds
    return expiryTime - now < threshold;
  } catch {
    return true;
  }
}

export async function getAccessToken(
  expected: AuthSessionSnapshot = captureAuthSession(),
): Promise<TokenInfo | null> {
  if (!isAuthSessionCurrent(expected)) return null;
  const token = getItem(ACCESS_TOKEN);
  if (!token || !isValidToken(token)) return refreshToken(expected);
  // A login or logout may have replaced the session while the JWT was being
  // inspected. A same-owner rotation is fine: that token still names this user.
  if (!isAuthSessionCurrent(expected)) return null;
  return { accessToken: token, refreshed: false };
}
