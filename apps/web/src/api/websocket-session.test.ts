// @vitest-environment jsdom
import { installAuthTokens, storedAccessToken } from '@/utils/auth-attempt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarAPI } from './calendar/calendar.api';
import { MessagesAPI } from './messages/messages.api';

const auth = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
const ioMock = vi.hoisted(() => vi.fn());
vi.mock('@/utils/auth', () => ({
  getAccessToken: auth.getAccessToken,
  isValidToken: () => true,
  refreshToken: async () => null,
}));
vi.mock('socket.io-client', () => ({ io: ioMock }));

type ManagerHandler = (error: unknown) => void;

type FakeSocket = {
  connected: boolean;
  auth: unknown;
  io: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    handlers: Map<string, ManagerHandler>;
  };
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
};

const fakeSocket = (): FakeSocket => {
  const handlers = new Map<string, ManagerHandler>();
  return {
    connected: false,
    auth: {},
    io: {
      on: vi.fn((event: string, handler: ManagerHandler) => {
        handlers.set(event, handler);
      }),
      off: vi.fn((event: string, handler: ManagerHandler) => {
        if (handlers.get(event) === handler) handlers.delete(event);
      }),
      handlers,
    },
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    connect: vi.fn(),
  };
};

const handshakeToken = (socket: FakeSocket) =>
  new Promise<string>((resolve) => {
    if (typeof socket.auth !== 'function') throw new Error('auth not set');
    (socket.auth as (send: (data: { token: string }) => void) => void)((data) =>
      resolve(data.token),
    );
  });

const cases = [
  {
    name: 'calendar',
    getSocket: () => CalendarAPI.getSocket() as unknown as FakeSocket,
    connectSocket: () => CalendarAPI.connectSocket(),
    disconnect: () => CalendarAPI.disconnectSocket(),
    cleanupDelay: 2000,
  },
  {
    name: 'messages',
    getSocket: () => MessagesAPI.getSocket() as unknown as FakeSocket,
    connectSocket: () => MessagesAPI.connectSocket(),
    disconnect: () => MessagesAPI.disconnectSocket(),
    cleanupDelay: 1000,
  },
];

describe('cached API sockets', () => {
  let created: FakeSocket[];

  beforeEach(() => {
    CalendarAPI.disconnectSocket();
    MessagesAPI.disconnectSocket();
    localStorage.clear();
    created = [];
    ioMock.mockReset();
    ioMock.mockImplementation(() => {
      const socket = fakeSocket();
      created.push(socket);
      return socket;
    });
    auth.getAccessToken.mockReset();
    auth.getAccessToken.mockImplementation(async () => ({
      accessToken: storedAccessToken(),
      refreshed: false,
    }));
  });

  afterEach(() => {
    CalendarAPI.disconnectSocket();
    MessagesAPI.disconnectSocket();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each(cases)(
    'recreates the $name socket for a successor login',
    async ({ getSocket, disconnect }) => {
      installAuthTokens('token-a', 'refresh-a');
      const first = getSocket();
      const firstErrorHandler = first.io.handlers.get('error');
      await expect(handshakeToken(first)).resolves.toBe('token-a');

      // The module stays loaded; only the login changes.
      installAuthTokens('token-b', 'refresh-b');
      const second = getSocket();

      expect(second).not.toBe(first);
      expect(first.disconnect).toHaveBeenCalled();
      expect(first.removeAllListeners).toHaveBeenCalled();
      // The replaced manager no longer reports into the module at all.
      expect(first.io.off).toHaveBeenCalledWith('error', firstErrorHandler);
      expect(first.io.handlers.has('error')).toBe(false);
      await expect(handshakeToken(second)).resolves.toBe('token-b');
      expect(ioMock).toHaveBeenCalledTimes(2);

      disconnect();
    },
  );

  it.each(cases)(
    'connects a $name successor while the old cleanup timer is pending',
    async ({ connectSocket, disconnect, cleanupDelay }) => {
      vi.useFakeTimers();
      try {
        installAuthTokens('token-a', 'refresh-a');
        await connectSocket();
        expect(created).toHaveLength(1);
        expect(created[0].connect).toHaveBeenCalledTimes(1);

        // Leave A's cleanup timer pending, then switch accounts.
        vi.advanceTimersByTime(100);
        installAuthTokens('token-b', 'refresh-b');
        await connectSocket();

        expect(created).toHaveLength(2);
        expect(created[1].connect).toHaveBeenCalledTimes(1);
        const tokenCalls = auth.getAccessToken.mock.calls.length;

        // A's timer fires before B's and must not erase B's pending attempt.
        vi.advanceTimersByTime(cleanupDelay - 100);
        await connectSocket();

        expect(created).toHaveLength(2);
        expect(auth.getAccessToken).toHaveBeenCalledTimes(tokenCalls);
        expect(created[1].connect).toHaveBeenCalledTimes(1);
        disconnect();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it.each(cases)(
    'detaches the $name manager error listener on dispose',
    async ({ getSocket, disconnect }) => {
      installAuthTokens('token-a', 'refresh-a');
      const first = getSocket();
      const staleHandler = first.io.handlers.get('error')!;

      disconnect();
      expect(first.io.off).toHaveBeenCalledWith('error', staleHandler);
      // A detached listener that still fires late must not touch the module.
      installAuthTokens('token-b', 'refresh-b');
      const second = getSocket();
      staleHandler({ message: 'Session ID unknown', data: { code: 1 } });

      expect(getSocket()).toBe(second);
      expect(ioMock).toHaveBeenCalledTimes(2);
      await expect(handshakeToken(second)).resolves.toBe('token-b');
    },
  );

  it.each(cases)(
    'keeps a $name retry on the same socket after the failed attempt timer',
    async ({ connectSocket, disconnect, cleanupDelay }) => {
      vi.useFakeTimers();
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      try {
        installAuthTokens('token-a', 'refresh-a');
        auth.getAccessToken.mockRejectedValueOnce(new Error('boom'));
        await expect(connectSocket()).rejects.toThrow('boom');
        expect(auth.getAccessToken).toHaveBeenCalledTimes(1);
        // Let the failed attempt's timer get its own deadline before the retry
        // registers its cleanup.
        vi.advanceTimersByTime(1);
        let resolveToken!: (value: {
          accessToken: string;
          refreshed: boolean;
        }) => void;
        auth.getAccessToken.mockReturnValueOnce(
          new Promise((resolve) => {
            resolveToken = resolve;
          }),
        );

        // Retry on the same socket before the failed attempt's timer fires.
        const retry = connectSocket();
        expect(auth.getAccessToken).toHaveBeenCalledTimes(2);
        vi.advanceTimersByTime(cleanupDelay - 1);
        const third = connectSocket();

        // The failed attempt's timer must not cancel the retry's ownership.
        expect(auth.getAccessToken).toHaveBeenCalledTimes(2);

        resolveToken({
          accessToken: storedAccessToken()!,
          refreshed: false,
        });
        await retry;
        await third;
        expect(created[0].connect).toHaveBeenCalledTimes(1);
        disconnect();
      } finally {
        consoleError.mockRestore();
        vi.useRealTimers();
      }
    },
  );
});
