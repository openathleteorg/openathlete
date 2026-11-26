// @vitest-environment jsdom
import axios from 'axios';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authTokenGeneration,
  installAuthTokens,
  invalidateAuthTokens,
  storedAccessToken,
  storedRefreshToken,
} from './auth-attempt';
import { keepSocketAuthenticated } from './socket-auth';

vi.mock('./capacitor', () => ({
  getApiBaseUrl: () => 'https://api.example.org',
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
    refuses: (message: string) =>
      listeners.get('exception')?.({ status: 'error', message }),
  };
  return socket;
}

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

const refreshResponse = (accessToken: string, refreshToken: string) => ({
  data: { accessToken, refreshToken },
});

describe('socket refresh generations', () => {
  let stop: (() => void) | null = null;

  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    stop?.();
    stop = null;
    vi.restoreAllMocks();
  });

  it('rotates generation 1 to 2 and then 3 on one connection', async () => {
    const initial = tokenExpiringIn(600);
    installAuthTokens(initial, 'refresh-1');
    const generation1 = authTokenGeneration();
    const first = tokenExpiringIn(3600);
    const second = tokenExpiringIn(7200);
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce(refreshResponse(first, 'refresh-2'))
      .mockResolvedValueOnce(refreshResponse(second, 'refresh-3'));

    const socket = fakeSocket();
    const authentication = keepSocketAuthenticated(socket as unknown as Socket);
    stop = authentication.stop;
    await expect(handshake(socket)).resolves.toEqual({ token: initial });

    // The server rejects the handshake token once its clock says it expired.
    socket.refuses('Unauthorized: jwt expired');
    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(1));
    const generation2 = authTokenGeneration();
    expect(generation2).not.toBe(generation1);
    expect(storedAccessToken()).toBe(first);
    expect(storedRefreshToken()).toBe('refresh-2');

    // The reconnected socket handshakes with the rotated credential.
    await expect(handshake(socket)).resolves.toEqual({ token: first });

    // The same connection expires again. Its captured owner/instance still
    // match, so the current generation, not the generation of the original
    // handshake, must be the one rotated.
    socket.refuses('Unauthorized: jwt expired');
    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(2));
    const generation3 = authTokenGeneration();
    expect(generation3).not.toBe(generation2);
    expect(storedAccessToken()).toBe(second);
    expect(storedRefreshToken()).toBe('refresh-3');

    const [[firstUrl, firstBody], [secondUrl, secondBody]] = post.mock.calls;
    expect(firstUrl).toBe('https://api.example.org/auth/refresh-token');
    expect(secondUrl).toBe('https://api.example.org/auth/refresh-token');
    expect(firstBody).toEqual({ refreshToken: 'refresh-1' });
    expect(secondBody).toEqual({ refreshToken: 'refresh-2' });
    await expect(handshake(socket)).resolves.toEqual({ token: second });
  });

  it('does not send an empty handshake when the credential is gone', async () => {
    const started = installAuthTokens(tokenExpiringIn(600), 'refresh');
    invalidateAuthTokens(started);

    const socket = fakeSocket();
    const authentication = keepSocketAuthenticated(socket as unknown as Socket);
    stop = authentication.stop;
    const send = vi.fn();
    startHandshake(socket, send);
    // Resolving without any credential still takes a few microtasks; let the
    // handshake continuation settle before asserting it stayed silent.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // An empty token would connect a socket the API will reject on every
    // event; fail closed instead.
    expect(send).not.toHaveBeenCalled();
  });
});
