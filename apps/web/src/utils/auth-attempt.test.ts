// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => 'https://train.example.org/api',
}));

const SESSION_KEY = 'auth_session';
const RECORD_PREFIX = 'auth_record:';
const REVOKED_PREFIX = 'auth_revoked:';
const ATTEMPT_KEY = 'auth_login_attempt';
const LEGACY_ACCESS_KEY = 'access_token';
const LEGACY_REFRESH_KEY = 'refresh_token';

const authRecordKeys = () =>
  Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index),
  ).filter(
    (key): key is string => key !== null && key.startsWith(RECORD_PREFIX),
  );

const authRecords = () =>
  authRecordKeys().map(
    (key) =>
      JSON.parse(localStorage.getItem(key)!) as {
        owner: string;
        accessToken: string | null;
        refreshToken: string | null;
      },
  );

describe('auth session storage ownership', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('keeps owner, generation and credentials in one owner-addressed record', async () => {
    const firstContext = await import('./auth-attempt');
    firstContext.installAuthTokens('token-a', 'refresh-a');
    const snapshot = firstContext.captureAuthSession();
    const record = JSON.parse(
      localStorage.getItem(`${RECORD_PREFIX}${snapshot.owner}`)!,
    ) as Record<string, unknown>;

    // The shared key names the owner; every credential stays in that owner's
    // record, so another writer cannot pair its bearer with this owner.
    expect(localStorage.getItem(SESSION_KEY)).toBe(snapshot.owner);
    expect(record).toMatchObject({
      owner: snapshot.owner,
      generation: snapshot.generation,
      accessToken: 'token-a',
      refreshToken: 'refresh-a',
    });
    // No split legacy credential can disagree with the owner.
    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBeNull();
    // Opaque IDs, never a shared read-modify-write counter.
    expect(snapshot.owner).not.toMatch(/^\d+$/);
    expect(snapshot.generation).not.toMatch(/^\d+$/);

    // A reload or a second tab rehydrates the same non-secret boundary.
    vi.resetModules();
    const secondContext = await import('./auth-attempt');
    expect(secondContext.captureAuthSession()).toMatchObject({
      owner: snapshot.owner,
      generation: snapshot.generation,
      accessToken: 'token-a',
    });

    const rotated = secondContext.captureAuthSession();
    secondContext.rotateAuthTokens(rotated, 'token-a2', 'refresh-a2');
    // Refresh rotation keeps the owner; only the exact credential changes.
    expect(firstContext.isAuthSessionCurrent(snapshot)).toBe(true);
    expect(firstContext.isAuthAttemptCurrent(snapshot)).toBe(false);

    const successor = secondContext.installAuthTokens('token-b', 'refresh-b');
    // A login in the other context replaces the owner everywhere.
    expect(firstContext.isAuthSessionCurrent(snapshot)).toBe(false);
    expect(successor.owner).not.toBe(snapshot.owner);
    expect(successor.generation).not.toBe(snapshot.generation);
    expect(localStorage.getItem(SESSION_KEY)).toBe(successor.owner);
    // The previous login's credential record is gone, not just unreferenced.
    expect(
      localStorage.getItem(`${RECORD_PREFIX}${snapshot.owner}`),
    ).toBeNull();
  });

  it('publishes one attempt pointer and lets only it commit', async () => {
    const firstContext = await import('./auth-attempt');
    const first = firstContext.beginAuthLogin();
    vi.resetModules();
    const secondContext = await import('./auth-attempt');
    const second = secondContext.beginAuthLogin();

    expect(second.ticket).not.toBe(first.ticket);
    expect(String(first.ticket)).not.toMatch(/^\d+$/);
    expect(localStorage.getItem(ATTEMPT_KEY)).toBe(second.ticket);
    expect(
      firstContext.commitAuthLogin(first, 'token-a', 'refresh-a'),
    ).toBeNull();

    const committed = secondContext.commitAuthLogin(
      second,
      'token-b',
      'refresh-b',
    );
    expect(committed).not.toBeNull();
    expect(firstContext.captureAuthSession().owner).toBe(committed?.owner);
  });

  it('binds a refresh to the exact credential that started it', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();

    expect(
      context.rotateAuthTokens(started, 'token-a2', 'refresh-a2'),
    ).not.toBeNull();
    // Another refresh (or a sign-out) already replaced that credential.
    expect(
      context.rotateAuthTokens(started, 'token-a3', 'refresh-a3'),
    ).toBeNull();
    expect(context.storedAccessToken()).toBe('token-a2');
    expect(context.storedRefreshToken()).toBe('refresh-a2');
    expect(context.isAuthSessionCurrent(started)).toBe(true);
  });

  it('never rewrites the shared owner pointer when rotating', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const before = localStorage.getItem(SESSION_KEY);

    context.rotateAuthTokens(
      context.captureAuthSession(),
      'token-a2',
      'refresh-a2',
    );

    // Rotation is addressed to its owner. Writing the pointer is how a slow
    // refresh could otherwise replace a successor login.
    expect(localStorage.getItem(SESSION_KEY)).toBe(before);
  });

  it('cannot label a refresh bearer with the owner that replaced it', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();

    // The other tab commits B exactly between this refresh's first owner read
    // and the read it used to label the rotated bearer.
    const originalGetItem = Storage.prototype.getItem;
    let pointerReads = 0;
    let injecting = false;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (!injecting && key === SESSION_KEY) {
        pointerReads += 1;
        if (pointerReads === 2) {
          injecting = true;
          context.installAuthTokens('token-b', 'refresh-b');
          injecting = false;
        }
      }
      return originalGetItem.call(this, key);
    });

    expect(
      context.rotateAuthTokens(started, 'token-a2', 'refresh-a2'),
    ).toBeNull();

    const session = context.captureAuthSession();
    expect(session.owner).not.toBe(started.owner);
    expect(context.storedAccessToken()).toBe('token-b');
    expect(context.storedRefreshToken()).toBe('refresh-b');
    // No stored record pairs B's owner with A's rotated bearer.
    expect(
      authRecords().some(
        (record) =>
          record.owner === session.owner && record.accessToken === 'token-a2',
      ),
    ).toBe(false);
  });

  it('scrubs a rotation whose owner signed out before its write landed', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();
    const originalSetItem = Storage.prototype.setItem;
    let injected = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      // The refresh already passed its checks; the owner signs out while the
      // rotated credential write is paused, then the write lands anyway.
      if (
        !injected &&
        key === `${RECORD_PREFIX}${started.owner}` &&
        value.includes('"accessToken":"token-a2"')
      ) {
        injected = true;
        context.clearAuthTokens(started);
      }
      originalSetItem.call(this, key, value);
    });

    expect(
      context.rotateAuthTokens(started, 'token-a2', 'refresh-a2'),
    ).toBeNull();

    // The tombstone keeps the owner signed out, and no unreachable record
    // retains the valid credential pair that its write recreated.
    expect(context.storedAccessToken()).toBeNull();
    expect(context.storedRefreshToken()).toBeNull();
    expect(localStorage.getItem(`${REVOKED_PREFIX}${started.owner}`)).not.toBe(
      null,
    );
    expect(
      authRecords().some(
        (record) =>
          record.accessToken === 'token-a2' ||
          record.refreshToken === 'refresh-a2',
      ),
    ).toBe(false);
  });

  it('scrubs its own rotation when a successor installs during the write', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();
    const originalSetItem = Storage.prototype.setItem;
    let injected = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      // B commits at the exact write of A's rotated credential.
      if (
        !injected &&
        key === `${RECORD_PREFIX}${started.owner}` &&
        value.includes('"accessToken":"token-a2"')
      ) {
        injected = true;
        context.installAuthTokens('token-b', 'refresh-b');
      }
      originalSetItem.call(this, key, value);
    });

    expect(
      context.rotateAuthTokens(started, 'token-a2', 'refresh-a2'),
    ).toBeNull();

    // B's login and credentials survive, and A's late record is gone rather
    // than left unreachable with a valid token pair.
    expect(context.storedAccessToken()).toBe('token-b');
    expect(context.storedRefreshToken()).toBe('refresh-b');
    expect(localStorage.getItem(`${RECORD_PREFIX}${started.owner}`)).toBeNull();
    expect(
      authRecords().some((record) => record.accessToken === 'token-a2'),
    ).toBe(false);
  });

  it('leaves a later same-owner generation written during the rotation', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    let recordReads = 0;
    let injected = false;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key === `${RECORD_PREFIX}${started.owner}`) {
        recordReads += 1;
        // The refresh starts from generation 1, writes generation 2, then a
        // newer rotation of the same owner writes generation 3 before the
        // first one checks its own late write.
        if (!injected && recordReads === 2) {
          injected = true;
          originalSetItem.call(
            this,
            key,
            JSON.stringify({
              owner: started.owner,
              generation: 'later-generation',
              accessToken: 'token-a3',
              refreshToken: 'refresh-a3',
            }),
          );
        }
      }
      return originalGetItem.call(this, key);
    });

    expect(
      context.rotateAuthTokens(started, 'token-a2', 'refresh-a2'),
    ).toBeNull();

    // The newer generation stays authoritative: the stale rotation neither
    // reports success nor removes the newer record.
    expect(context.storedAccessToken()).toBe('token-a3');
    expect(context.storedRefreshToken()).toBe('refresh-a3');
    expect(context.captureAuthSession().generation).toBe('later-generation');
  });

  it('cannot revive an owner that signed out while its refresh was pending', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();
    expect(context.clearAuthTokens(started)).toBe(true);

    // The pending refresh can only find its own revoked owner.
    expect(
      context.rotateAuthTokens(started, 'token-a2', 'refresh-a2'),
    ).toBeNull();
    expect(context.storedAccessToken()).toBeNull();

    // Even a writer that lands after the sign-out cannot revive the owner:
    // the revocation tombstone is checked before its credential record.
    localStorage.setItem(
      `${RECORD_PREFIX}${started.owner}`,
      JSON.stringify({
        owner: started.owner,
        generation: 'late-generation',
        accessToken: 'token-a2',
        refreshToken: 'refresh-a2',
      }),
    );
    expect(context.captureAuthSession().accessToken).toBeNull();
    expect(context.storedAccessToken()).toBeNull();
  });

  it('keeps a successor that commits while sign-out writes', async () => {
    const context = await import('./auth-attempt');
    context.installAuthTokens('token-a', 'refresh-a');
    const started = context.captureAuthSession();

    // B commits at the exact write of A's signed-out credential.
    const originalSetItem = Storage.prototype.setItem;
    let injected = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      const signedOutCredential =
        (key === SESSION_KEY || key.startsWith(RECORD_PREFIX)) &&
        value.includes('"accessToken":null');
      if (!injected && signedOutCredential) {
        injected = true;
        context.installAuthTokens('token-b', 'refresh-b');
      }
      originalSetItem.call(this, key, value);
    });

    expect(context.clearAuthTokens(started)).toBe(true);

    expect(context.storedAccessToken()).toBe('token-b');
    expect(context.storedRefreshToken()).toBe('refresh-b');
    expect(context.captureAuthSession().owner).not.toBe(started.owner);
  });

  it('fails closed on legacy tokens without writing a session', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');

    const { captureAuthSession, storedAccessToken, storedRefreshToken } =
      await import('./auth-attempt');

    const reads: string[] = [];
    const originalGetItem = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      reads.push(key);
      return originalGetItem.call(this, key);
    });

    expect(captureAuthSession()).toMatchObject({
      owner: 'none',
      accessToken: null,
    });
    expect(storedAccessToken()).toBeNull();
    expect(storedRefreshToken()).toBeNull();

    // A legacy install must not be adopted, and a read must never publish a
    // record: that write is what a concurrent sign-out could race.
    expect(reads).not.toContain(LEGACY_ACCESS_KEY);
    expect(reads).not.toContain(LEGACY_REFRESH_KEY);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authRecords()).toHaveLength(0);
    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBe('legacy-access');
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBe('legacy-refresh');
  });

  it('does not revive legacy tokens after a signed-out record', async () => {
    const {
      installAuthTokens,
      captureAuthSession,
      clearAuthTokens,
      storedAccessToken,
    } = await import('./auth-attempt');
    installAuthTokens('token-a', 'refresh-a');
    const session = captureAuthSession();
    expect(clearAuthTokens(session)).toBe(true);

    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');

    const signedOut = captureAuthSession();
    expect(signedOut).toMatchObject({
      owner: 'none',
      accessToken: null,
    });
    expect(storedAccessToken()).toBeNull();
    // The owner stays named by the pointer, but its revocation shadows it.
    expect(localStorage.getItem(SESSION_KEY)).toBe(session.owner);
    expect(localStorage.getItem(`${REVOKED_PREFIX}${session.owner}`)).not.toBe(
      null,
    );
    expect(
      JSON.parse(localStorage.getItem(`${RECORD_PREFIX}${session.owner}`)!),
    ).toMatchObject({ owner: session.owner, accessToken: null });
  });

  it('keeps the signed-out boundary when logout clears device storage', async () => {
    const {
      installAuthTokens,
      captureAuthSession,
      clearAuthTokens,
      isAuthSessionCurrent,
    } = await import('./auth-attempt');
    const { clear } = await import('./local-storage');
    installAuthTokens('token-a', 'refresh-a');
    const snapshot = captureAuthSession();
    expect(clearAuthTokens(snapshot)).toBe(true);

    clear();

    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
    const signedOut = captureAuthSession();
    expect(signedOut).toMatchObject({
      owner: 'none',
      accessToken: null,
    });
    expect(signedOut.generation).toBe('none');
    const record = JSON.parse(
      localStorage.getItem(`${RECORD_PREFIX}${snapshot.owner}`)!,
    ) as Record<string, unknown>;
    expect(record).toMatchObject({
      owner: snapshot.owner,
      accessToken: null,
      refreshToken: null,
    });
    expect(localStorage.getItem(`${REVOKED_PREFIX}${snapshot.owner}`)).not.toBe(
      null,
    );
    // A successor owner signalled sign-out; legacy tokens cannot revive it.
    expect(isAuthSessionCurrent(snapshot)).toBe(false);
  });
});
