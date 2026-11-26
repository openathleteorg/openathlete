// @vitest-environment jsdom
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAccessToken, refreshToken } from './auth';
import {
  installAuthTokens,
  storedAccessToken,
  storedRefreshToken,
} from './auth-attempt';
import { keepSocketAuthenticated } from './socket-auth';

vi.mock('./auth', async (importActual) => ({
  ...(await importActual<typeof import('./auth')>()),
  getAccessToken: vi.fn(),
  refreshToken: vi.fn(),
}));

const tokenExpiringIn = (seconds: number) =>
  `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.signature`;

// Just what the helper uses of a Socket.IO client socket
function fakeSocket() {
  const listeners = new Map<string, (payload: unknown) => void>();
  const socket = {
    connected: true,
    auth: {} as Socket['auth'],
    on: vi.fn((event: string, listener: (payload: unknown) => void) => {
      listeners.set(event, listener);
      return socket;
    }),
    off: vi.fn(),
    disconnect: vi.fn(() => socket),
    connect: vi.fn(() => socket),
    // What Nest sends when a guard refuses an event
    refuses: (message: string) =>
      listeners.get('exception')?.({ status: 'error', message }),
  };
  return socket;
}

// Runs the handshake as Socket.IO would and resolves with the token it sends
const handshake = (socket: ReturnType<typeof fakeSocket>) =>
  new Promise<unknown>((resolve) => {
    if (typeof socket.auth !== 'function') throw new Error('auth not set');
    socket.auth((data) => resolve(data));
  });

const startHandshake = (
  socket: ReturnType<typeof fakeSocket>,
  send: (data: unknown) => void,
) => {
  if (typeof socket.auth !== 'function') throw new Error('auth not set');
  socket.auth(send);
};

describe('keepSocketAuthenticated', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getAccessToken).mockReset();
    vi.mocked(refreshToken).mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('sends the current token with every handshake without installing it', async () => {
    installAuthTokens('installed-access', 'installed-refresh');
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    const first = tokenExpiringIn(3600);
    const second = tokenExpiringIn(7200);

    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: first,
      refreshed: false,
    });
    await expect(handshake(socket)).resolves.toEqual({ token: first });

    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: second,
      refreshToken: 'new-refresh',
      refreshed: true,
    });
    await expect(handshake(socket)).resolves.toEqual({ token: second });
    // Refreshing is auth's job: a consumer must not write its result, or a
    // late answer could restore the previous account.
    expect(storedAccessToken()).toBe('installed-access');
    expect(storedRefreshToken()).toBe('installed-refresh');
  });

  it('does not send a handshake for a session replaced while resolving', async () => {
    installAuthTokens('token-a', 'refresh-a');
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    const send = vi.fn();
    let resolveToken!: (
      value: Awaited<ReturnType<typeof getAccessToken>>,
    ) => void;
    vi.mocked(getAccessToken).mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );

    startHandshake(socket, send);
    await vi.waitFor(() => expect(getAccessToken).toHaveBeenCalled());
    installAuthTokens('token-b', 'refresh-b');
    resolveToken({ accessToken: tokenExpiringIn(3600), refreshed: false });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(send).not.toHaveBeenCalled();
  });

  it('does not send a handshake after stop', async () => {
    installAuthTokens('token-a', 'refresh-a');
    const socket = fakeSocket();
    const authentication = keepSocketAuthenticated(socket as unknown as Socket);
    const send = vi.fn();
    let resolveToken!: (
      value: Awaited<ReturnType<typeof getAccessToken>>,
    ) => void;
    vi.mocked(getAccessToken).mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );

    startHandshake(socket, send);
    authentication.stop();
    resolveToken({ accessToken: tokenExpiringIn(3600), refreshed: false });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(send).not.toHaveBeenCalled();
  });

  it('ignores an expired event from a session that was replaced', async () => {
    installAuthTokens('token-a', 'refresh-a');
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: tokenExpiringIn(600),
      refreshed: false,
    });
    await handshake(socket);

    installAuthTokens('token-b', 'refresh-b');
    socket.refuses('Unauthorized: jwt expired');
    await Promise.resolve();
    await Promise.resolve();

    expect(refreshToken).not.toHaveBeenCalled();
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  // The server checks each event against the handshake token: a connected
  // socket must reconnect once that token expires, or every event fails.
  it('reconnects a connected socket once its token expired', async () => {
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: tokenExpiringIn(90),
      refreshed: false,
    });
    await handshake(socket);

    vi.advanceTimersByTime(60 * 1000);
    expect(socket.disconnect).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60 * 1000);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('reconnects with a new token when the server finds it expired', async () => {
    // The device's clock still deems the token valid
    const stale = tokenExpiringIn(600);
    installAuthTokens(stale, 'stale-refresh');
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: stale,
      refreshed: false,
    });
    await handshake(socket);
    const fresh = tokenExpiringIn(3600);
    vi.mocked(refreshToken).mockResolvedValueOnce({
      accessToken: fresh,
      refreshToken: 'new-refresh',
      refreshed: true,
    });

    socket.refuses('Unauthorized: jwt expired');
    socket.refuses('Unauthorized: jwt expired');
    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(1));

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    // The refresh helper owns installation; the socket only reconnects.
    expect(storedAccessToken()).toBe(stale);
    expect(storedRefreshToken()).toBe('stale-refresh');
  });

  it('ignores a refresh that resolves after a successor signed in', async () => {
    const stale = tokenExpiringIn(600);
    installAuthTokens(stale, 'stale-refresh');
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: stale,
      refreshed: false,
    });
    await handshake(socket);

    let resolveRefresh!: (
      value: Awaited<ReturnType<typeof refreshToken>>,
    ) => void;
    vi.mocked(refreshToken).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    socket.refuses('Unauthorized: jwt expired');
    await vi.waitFor(() => expect(refreshToken).toHaveBeenCalledTimes(1));

    // Account B commits while the socket refresh is in flight.
    installAuthTokens('token-b', 'refresh-b');
    resolveRefresh({
      accessToken: tokenExpiringIn(3600),
      refreshToken: 'new-refresh',
      refreshed: true,
    });
    // Let the stale refresh continuation settle before asserting that it had
    // no effect on the successor's session or this socket.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(storedAccessToken()).toBe('token-b');
    expect(storedRefreshToken()).toBe('refresh-b');
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('stays put when no new token can be obtained', async () => {
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);
    vi.mocked(refreshToken).mockResolvedValueOnce(null);

    socket.refuses('Unauthorized: jwt expired');
    await vi.waitFor(() => expect(refreshToken).toHaveBeenCalled());
    await Promise.resolve();

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('ignores other refusals', () => {
    const socket = fakeSocket();
    keepSocketAuthenticated(socket as unknown as Socket);

    socket.refuses('Unauthorized: No token provided');

    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('stops checking once stopped', async () => {
    const socket = fakeSocket();
    const authentication = keepSocketAuthenticated(socket as unknown as Socket);
    vi.mocked(getAccessToken).mockResolvedValueOnce({
      accessToken: tokenExpiringIn(-1),
      refreshed: false,
    });
    await handshake(socket);

    authentication.stop();
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(socket.disconnect).not.toHaveBeenCalled();
  });
});
