import type { OauthConnectSource } from './analytics-events';
import type { AuthSessionSnapshot } from './auth-attempt';

export type PkceProvider = 'GARMIN' | 'COROS';

type Owner = Pick<AuthSessionSnapshot, 'owner' | 'instanceURL'>;
type PendingProviderOAuth = Owner & {
  codeVerifier: string;
  source: OauthConnectSource;
};

const PREFIX = 'provider_oauth:';

export function usesProviderPkce(provider: string): provider is PkceProvider {
  return provider === 'GARMIN' || provider === 'COROS';
}

export function isProviderOAuthNonce(nonce: string): boolean {
  return /^[a-f0-9]{32}$/.test(nonce);
}

function ownerPrefix(owner: string): string {
  return `${PREFIX}${owner}:`;
}

function providerPrefix(owner: string, provider: PkceProvider): string {
  return `${ownerPrefix(owner)}${provider}:`;
}

/** A new user action supersedes any prior flow for this login and provider. */
export function beginProviderOAuth(
  owner: string,
  provider: PkceProvider,
): string {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const prefix = providerPrefix(owner, provider);
  const activeKey = `${prefix}active`;
  // Snapshot before publishing. We only remove records that existed before
  // this action, so a concurrent newer flow's verifier stays untouched.
  const superseded = Object.keys(localStorage).filter(
    (key) => key !== activeKey && key.startsWith(prefix),
  );
  localStorage.setItem(activeKey, nonce);
  for (const key of superseded) localStorage.removeItem(key);
  return nonce;
}

export function isProviderOAuthPending(
  owner: string,
  provider: PkceProvider,
  nonce: string,
): boolean {
  return (
    localStorage.getItem(`${providerPrefix(owner, provider)}active`) === nonce
  );
}

/** Keep only the login identity and the provider's PKCE verifier over redirects. */
export function rememberProviderOAuth(
  session: Owner,
  provider: PkceProvider,
  nonce: string,
  codeVerifier: string,
  source: OauthConnectSource,
): void {
  const pending: PendingProviderOAuth = {
    owner: session.owner,
    instanceURL: session.instanceURL,
    codeVerifier,
    source,
  };
  localStorage.setItem(
    `${providerPrefix(session.owner, provider)}${nonce}`,
    JSON.stringify(pending),
  );
}

export function forgetProviderOAuth(
  owner: string,
  provider: PkceProvider,
  nonce: string,
): void {
  localStorage.removeItem(`${providerPrefix(owner, provider)}${nonce}`);
}

export function takeProviderOAuth(
  session: Owner,
  provider: PkceProvider,
  nonce: string,
): PendingProviderOAuth | null {
  try {
    if (!isProviderOAuthPending(session.owner, provider, nonce)) return null;
    const key = `${providerPrefix(session.owner, provider)}${nonce}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const pending = JSON.parse(raw) as Partial<PendingProviderOAuth>;
    // A callback from another instance may not consume the matching entry.
    if (pending?.instanceURL !== session.instanceURL) return null;
    localStorage.removeItem(key);
    if (
      pending.owner !== session.owner ||
      typeof pending.codeVerifier !== 'string' ||
      !pending.codeVerifier ||
      (pending.source !== 'settings' && pending.source !== 'onboarding') ||
      !isProviderOAuthPending(session.owner, provider, nonce)
    ) {
      return null;
    }
    return {
      owner: pending.owner,
      instanceURL: pending.instanceURL,
      codeVerifier: pending.codeVerifier,
      source: pending.source,
    };
  } catch {
    return null;
  }
}

/** Remove only this owner's pending verifiers when that session ends. */
export function retireProviderOAuth(owner: string): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(ownerPrefix(owner))) localStorage.removeItem(key);
    }
  } catch {
    // Callbacks also check the current owner and instance before using storage.
  }
}

export function retireLegacyProviderOAuth(): void {
  try {
    localStorage.removeItem('oauth_code_verifier_GARMIN');
    localStorage.removeItem('oauth_code_verifier_COROS');
  } catch {
    // The callback cannot use unowned verifiers from earlier versions.
  }
}
