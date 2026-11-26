import {
  type AuthLoginAttempt,
  captureAuthSession,
  isAuthLoginCurrent,
} from './auth-attempt';

const OIDC_LOGIN_ATTEMPT = 'openathlete-oidc-login-attempt';

export function rememberOidcLoginAttempt({
  ticket,
  owner,
  instanceURL,
}: AuthLoginAttempt): boolean {
  try {
    // Only the non-secret login identity can survive the full-page redirect.
    sessionStorage.setItem(
      OIDC_LOGIN_ATTEMPT,
      JSON.stringify({ ticket, owner, instanceURL }),
    );
    return true;
  } catch {
    return false;
  }
}

export function takeOidcLoginAttempt(
  ticket: string | null,
): AuthLoginAttempt | null {
  if (!ticket) return null;
  try {
    const value = sessionStorage.getItem(OIDC_LOGIN_ATTEMPT);
    if (!value) return null;
    const attempt = JSON.parse(value) as {
      ticket?: unknown;
      owner?: unknown;
      instanceURL?: unknown;
    };
    // A late callback must leave a newer redirect's ticket available.
    if (attempt.ticket !== ticket) return null;
    sessionStorage.removeItem(OIDC_LOGIN_ATTEMPT);
    if (
      typeof attempt.owner !== 'string' ||
      typeof attempt.instanceURL !== 'string' ||
      !isAuthLoginCurrent({
        ticket,
        owner: attempt.owner,
        instanceURL: attempt.instanceURL,
      })
    ) {
      return null;
    }
    const session = captureAuthSession();
    if (
      session.owner !== attempt.owner ||
      session.instanceURL !== attempt.instanceURL
    ) {
      return null;
    }
    return { ...session, ticket };
  } catch {
    return null;
  }
}
