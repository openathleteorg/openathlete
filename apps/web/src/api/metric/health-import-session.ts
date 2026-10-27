import { isValidToken } from '@/utils/auth';
import { getApiBaseUrl } from '@/utils/capacitor';
import { type HealthKitBinding } from '@/utils/healthkit';
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  getItem,
  setItem,
} from '@/utils/local-storage';
import axios from 'axios';

// No shared auth interceptor: refresh must remain pinned to the same server,
// account and credentials that the user authorized for this health action.
const transport = axios.create({ timeout: 30_000 });
function account(token: string): string {
  try {
    const payload: unknown = JSON.parse(
      atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')),
    );
    if (payload && typeof payload === 'object' && 'userId' in payload)
      return String(payload.userId);
  } catch {
    /* A malformed credential must never select another account. */
  }
  throw new Error('HEALTH_IMPORT_WRONG_ACCOUNT');
}
export async function healthImportSession({
  binding,
  consent,
  isCurrent,
  signal,
}: {
  binding: HealthKitBinding;
  consent: boolean;
  isCurrent: () => boolean;
  signal: AbortSignal;
}) {
  const url = new URL(binding.apiBaseURL);
  if (
    !consent ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('HEALTH_IMPORT_NOT_AUTHORIZED');
  let token = getItem(ACCESS_TOKEN);
  let refresh = getItem(REFRESH_TOKEN);
  if (token && account(token) !== binding.accountID)
    throw new Error('HEALTH_IMPORT_WRONG_ACCOUNT');
  let renewing = true;
  const assertCurrent = () => {
    if (
      !isCurrent() ||
      signal.aborted ||
      getApiBaseUrl() !== binding.apiBaseURL ||
      (renewing
        ? getItem(ACCESS_TOKEN) !== token || getItem(REFRESH_TOKEN) !== refresh
        : !sameAccountCredentials())
    )
      throw new Error('HEALTH_IMPORT_SESSION_CHANGED');
  };
  // A normal renewal elsewhere in the app must not cancel a long upload.
  // Keep the request's original bearer token; never adopt new credentials here.
  const sameAccountCredentials = () => {
    const access = getItem(ACCESS_TOKEN);
    const currentRefresh = getItem(REFRESH_TOKEN);
    if (!access || !currentRefresh) return false;
    try {
      return (
        account(access) === binding.accountID &&
        account(currentRefresh) === binding.accountID
      );
    } catch {
      return false;
    }
  };
  assertCurrent();
  if (!token || !isValidToken(token)) {
    if (!refresh || !isValidToken(refresh))
      throw new Error('HEALTH_IMPORT_LOGIN_REQUIRED');
    if (account(refresh) !== binding.accountID)
      throw new Error('HEALTH_IMPORT_WRONG_ACCOUNT');
    const response = await transport.post<{
      accessToken: string;
      refreshToken: string;
    }>(
      `${binding.apiBaseURL.replace(/\/+$/, '')}/auth/refresh-token`,
      { refreshToken: refresh },
      { signal },
    );
    assertCurrent();
    const next = response.data;
    if (
      !next ||
      typeof next.accessToken !== 'string' ||
      typeof next.refreshToken !== 'string' ||
      !isValidToken(next.accessToken) ||
      !isValidToken(next.refreshToken) ||
      account(next.accessToken) !== binding.accountID ||
      account(next.refreshToken) !== binding.accountID
    )
      throw new Error('HEALTH_IMPORT_WRONG_ACCOUNT');
    setItem(REFRESH_TOKEN, next.refreshToken);
    setItem(ACCESS_TOKEN, next.accessToken);
    token = next.accessToken;
    refresh = next.refreshToken;
    assertCurrent();
  }
  if (!token) throw new Error('HEALTH_IMPORT_LOGIN_REQUIRED');
  renewing = false;
  assertCurrent();
  return { token, assertCurrent, url };
}

/** Safe reason codes only; never surface server bodies or Health sample values. */
export function healthImportFailure(
  reason: unknown,
): 'login' | 'conflict' | 'size' | 'invalid' | 'network' | 'other' {
  const message = reason instanceof Error ? reason.message : '';
  const status =
    reason &&
    typeof reason === 'object' &&
    'response' in reason &&
    reason.response &&
    typeof reason.response === 'object' &&
    'status' in reason.response
      ? reason.response.status
      : undefined;
  if (
    status === 401 ||
    message === 'HEALTH_IMPORT_LOGIN_REQUIRED' ||
    message === 'HEALTH_IMPORT_NOT_AUTHORIZED'
  )
    return 'login';
  if (status === 409) return 'conflict';
  const code =
    reason && typeof reason === 'object' && 'code' in reason
      ? reason.code
      : message;
  if (
    status === 413 ||
    message === 'HEALTH_WORKOUT_TOO_LARGE' ||
    code === 'HEALTHKIT_STORAGE_LIMIT'
  )
    return 'size';
  if (
    status === 400 ||
    status === 422 ||
    (reason instanceof Error && reason.name === 'ZodError')
  )
    return 'invalid';
  if (!status && reason && typeof reason === 'object' && 'request' in reason)
    return 'network';
  return 'other';
}
