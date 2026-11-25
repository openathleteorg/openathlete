// @vitest-environment jsdom
import { installAuthTokens } from '@/utils/auth-attempt';
import { ACCESS_TOKEN } from '@/utils/local-storage';
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

type FakeSocket = {
  connected: boolean;
  auth: unknown;
  io: { on: ReturnType<typeof vi.fn> };
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
};

const fakeSocket = (): FakeSocket => ({
  connected: false,
  auth: {},
  io: { on: vi.fn() },
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  connect: vi.fn(),
});

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
    disconnect: () => CalendarAPI.disconnectSocket(),
  },
  {
    name: 'messages',
    getSocket: () => MessagesAPI.getSocket() as unknown as FakeSocket,
    disconnect: () => MessagesAPI.disconnectSocket(),
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
      accessToken: localStorage.getItem(ACCESS_TOKEN),
      refreshed: false,
    }));
  });

  afterEach(() => {
    CalendarAPI.disconnectSocket();
    MessagesAPI.disconnectSocket();
  });

  it.each(cases)(
    'recreates the $name socket for a successor login',
    async ({ getSocket, disconnect }) => {
      installAuthTokens('token-a', 'refresh-a');
      const first = getSocket();
      await expect(handshakeToken(first)).resolves.toBe('token-a');

      // The module stays loaded; only the login changes.
      installAuthTokens('token-b', 'refresh-b');
      const second = getSocket();

      expect(second).not.toBe(first);
      expect(first.disconnect).toHaveBeenCalled();
      expect(first.removeAllListeners).toHaveBeenCalled();
      await expect(handshakeToken(second)).resolves.toBe('token-b');
      expect(ioMock).toHaveBeenCalledTimes(2);

      disconnect();
    },
  );
});
