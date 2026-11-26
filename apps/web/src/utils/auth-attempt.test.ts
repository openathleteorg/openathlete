// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const server = vi.hoisted(() => ({ url: 'https://train.example.org/api' }));
vi.mock(
  '@/utils/auth-login-lock',
  () => import('@/utils/test/auth-login-lock'),
);

vi.mock('./capacitor', () => ({ getApiBaseUrl: () => server.url }));

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
    server.url = 'https://train.example.org/api';
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
    const first = await firstContext.beginAuthLogin();
    vi.resetModules();
    const secondContext = await import('./auth-attempt');
    const second = await secondContext.beginAuthLogin();

    expect(second.ticket).not.toBe(first.ticket);
    expect(String(first.ticket)).not.toMatch(/^\d+$/);
    expect(localStorage.getItem(ATTEMPT_KEY)).toBe(second.ticket);
    expect(
      await firstContext.commitAuthLogin(first, 'token-a', 'refresh-a'),
    ).toBeNull();

    const committed = await secondContext.commitAuthLogin(
      second,
      'token-b',
      'refresh-b',
    );
    expect(committed).not.toBeNull();
    expect(firstContext.captureAuthSession().owner).toBe(committed?.owner);
  });

  it('keeps a newer login requested during the previous credential write', async () => {
    const context = await import('./auth-attempt');
    const first = await context.beginAuthLogin();
    const originalSetItem = Storage.prototype.setItem;
    let successor: ReturnType<typeof context.commitAuthLogin> | undefined;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      originalSetItem.call(this, key, value);
      if (key.startsWith(RECORD_PREFIX) && value.includes('token-a')) {
        successor = context
          .beginAuthLogin()
          .then((attempt) =>
            context.commitAuthLogin(attempt, 'token-b', 'refresh-b'),
          );
      }
    });

    await context.commitAuthLogin(first, 'token-a', 'refresh-a');

    expect(successor).toBeDefined();
    const committed = await successor;
    expect(context.captureAuthSession()).toEqual(committed);
    expect(context.storedAccessToken()).toBe('token-b');
    expect(context.storedRefreshToken()).toBe('refresh-b');
    expect(authRecords()).toEqual([
      expect.objectContaining({ accessToken: 'token-b' }),
    ]);
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

  it.each([
    ['legacy-access', 'legacy-refresh'],
    ['legacy-access', null],
    [null, 'legacy-refresh'],
  ])(
    'upgrades stored credentials (%s, %s) and rehydrates the session',
    async (access, refresh) => {
      if (access) localStorage.setItem(LEGACY_ACCESS_KEY, access);
      if (refresh) localStorage.setItem(LEGACY_REFRESH_KEY, refresh);
      const first = await import('./auth-attempt');

      first.migrateLegacyAuthSession();

      const migrated = first.captureAuthSession();
      expect(migrated.owner).not.toBe('none');
      expect(migrated.accessToken).toBe(access);
      expect(first.storedRefreshToken()).toBe(refresh);
      expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBeNull();
      expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBeNull();

      vi.resetModules();
      const reloaded = await import('./auth-attempt');
      reloaded.migrateLegacyAuthSession();
      expect(reloaded.captureAuthSession()).toEqual(migrated);
      expect(reloaded.storedRefreshToken()).toBe(refresh);
    },
  );

  it('keeps ordinary auth reads free of legacy lookups or writes', async () => {
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

    expect(reads).not.toContain(LEGACY_ACCESS_KEY);
    expect(reads).not.toContain(LEGACY_REFRESH_KEY);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authRecords()).toHaveLength(0);
    expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBe('legacy-access');
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBe('legacy-refresh');
  });

  it('keeps a successor login that commits during the migration write', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    const context = await import('./auth-attempt');
    const originalSetItem = Storage.prototype.setItem;
    let successor: ReturnType<typeof context.installAuthTokens> | undefined;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (value.includes('legacy-access')) {
        successor = context.installAuthTokens('new-access', 'new-refresh');
      }
      originalSetItem.call(this, key, value);
    });

    context.migrateLegacyAuthSession();

    expect(successor).toBeDefined();
    expect(context.captureAuthSession()).toEqual(successor);
    expect(context.storedRefreshToken()).toBe('new-refresh');
    expect(Object.values(localStorage).join()).not.toContain('legacy-access');
  });

  it('keeps the initial boundary signed out when migration writes late', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    const context = await import('./auth-attempt');
    const initial = context.captureAuthSession();
    const originalSetItem = Storage.prototype.setItem;
    let signedOut = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (value.includes('legacy-access')) {
        signedOut = true;
        context.clearAuthTokens(initial);
      }
      originalSetItem.call(this, key, value);
    });

    context.migrateLegacyAuthSession();

    expect(signedOut).toBe(true);
    expect(context.storedAccessToken()).toBeNull();
    expect(context.storedRefreshToken()).toBeNull();
    expect(Object.values(localStorage).join()).not.toContain('legacy-access');
  });

  it('keeps credentials rotated by another upgrader during the migration write', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    const context = await import('./auth-attempt');
    const originalSetItem = Storage.prototype.setItem;
    let rotating = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (!rotating && value.includes('legacy-access')) {
        rotating = true;
        context.migrateLegacyAuthSession();
        context.rotateAuthTokens(
          context.captureAuthSession(),
          'rotated-access',
          'rotated-refresh',
        );
      }
      originalSetItem.call(this, key, value);
    });

    context.migrateLegacyAuthSession();

    expect(context.storedAccessToken()).toBe('rotated-access');
    expect(context.storedRefreshToken()).toBe('rotated-refresh');
    expect(Object.values(localStorage).join()).not.toContain('legacy-access');
  });

  it('keeps the full pair when another tab migrates between the split reads', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    const context = await import('./auth-attempt');
    const originalGetItem = Storage.prototype.getItem;
    let migrated = false;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (!migrated && key === LEGACY_REFRESH_KEY) {
        migrated = true;
        context.migrateLegacyAuthSession();
      }
      return originalGetItem.call(this, key);
    });

    context.migrateLegacyAuthSession();

    expect(context.storedAccessToken()).toBe('legacy-access');
    expect(context.storedRefreshToken()).toBe('legacy-refresh');
  });

  it('finishes clearing the split keys on the next startup', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    const context = await import('./auth-attempt');
    const originalRemoveItem = Storage.prototype.removeItem;
    const interruptedCleanup = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(function (this: Storage, key: string) {
        if (key !== LEGACY_REFRESH_KEY) originalRemoveItem.call(this, key);
      });
    context.migrateLegacyAuthSession();
    const migrated = context.captureAuthSession();
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBe('legacy-refresh');
    interruptedCleanup.mockRestore();

    context.migrateLegacyAuthSession();

    expect(context.captureAuthSession()).toEqual(migrated);
    expect(context.storedRefreshToken()).toBe('legacy-refresh');
    expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBeNull();
  });

  it.each([false, true])(
    'keeps split tokens when the seed cannot persist (throws: %s)',
    async (throws) => {
      localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
      localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
      const context = await import('./auth-attempt');
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        if (throws) throw new DOMException('', 'QuotaExceededError');
      });

      context.migrateLegacyAuthSession();

      expect(localStorage.getItem(LEGACY_ACCESS_KEY)).toBe('legacy-access');
      expect(localStorage.getItem(LEGACY_REFRESH_KEY)).toBe('legacy-refresh');
    },
  );

  it('never exposes migration credentials to a server that replaced the initial instance', async () => {
    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    const context = await import('./auth-attempt');
    const originalSetItem = Storage.prototype.setItem;
    let switched = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (value.includes('legacy-access')) {
        localStorage.clear();
        server.url = 'https://other.example.org/api';
        switched = true;
      }
      originalSetItem.call(this, key, value);
      if (switched) expect(context.captureAuthSession().accessToken).toBeNull();
    });

    context.migrateLegacyAuthSession();

    expect(switched).toBe(true);
    expect(context.storedAccessToken()).toBeNull();
    expect(context.storedRefreshToken()).toBeNull();
    expect(Object.values(localStorage).join()).not.toContain('legacy-access');
  });

  it('does not revive legacy tokens after a signed-out record', async () => {
    const {
      installAuthTokens,
      captureAuthSession,
      clearAuthTokens,
      migrateLegacyAuthSession,
      storedAccessToken,
    } = await import('./auth-attempt');
    installAuthTokens('token-a', 'refresh-a');
    const session = captureAuthSession();
    expect(clearAuthTokens(session)).toBe(true);

    localStorage.setItem(LEGACY_ACCESS_KEY, 'legacy-access');
    localStorage.setItem(LEGACY_REFRESH_KEY, 'legacy-refresh');
    migrateLegacyAuthSession();

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
