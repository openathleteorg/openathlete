import type { Socket } from 'socket.io-client';

import { getAccessToken, isValidToken, refreshToken } from './auth';
import { ACCESS_TOKEN, REFRESH_TOKEN, setItem } from './local-storage';

const EXPIRY_CHECK_INTERVAL = 60 * 1000;

type TokenInfo = Awaited<ReturnType<typeof getAccessToken>>;

export type SocketAuthentication = {
  /** Reconnects with a fresh token when the one of the handshake expired. */
  reconnectIfExpired: () => void;
  stop: () => void;
};

const storeTokens = (info: TokenInfo) => {
  if (info?.refreshToken) {
    setItem(ACCESS_TOKEN, info.accessToken);
    setItem(REFRESH_TOKEN, info.refreshToken);
  }
};

/**
 * The API authenticates every socket event with the token of the handshake,
 * which stays the same for the whole connection: a token refreshed later only
 * reaches the server when the socket reconnects. This hands each connection a
 * fresh token and reconnects once it expires, so a tab or the app left open
 * keeps its real-time updates.
 */
export function keepSocketAuthenticated(socket: Socket): SocketAuthentication {
  let handshakeToken: string | null = null;
  let refreshing = false;

  socket.auth = (send) => {
    void getAccessToken()
      .catch(() => null)
      .then((info) => {
        storeTokens(info);
        handshakeToken = info?.accessToken ?? null;
        send({ token: handshakeToken ?? '' });
      });
  };

  const reconnectIfExpired = () => {
    if (socket.connected && handshakeToken && !isValidToken(handshakeToken)) {
      socket.disconnect().connect();
    }
  };

  // The server refused an event because the token expired, whatever the
  // device's clock says. Reconnecting only with a new token avoids a loop
  // once the refresh token is no longer valid.
  const onException = (error: { message?: unknown }) => {
    if (
      refreshing ||
      typeof error?.message !== 'string' ||
      !error.message.includes('jwt expired')
    ) {
      return;
    }
    refreshing = true;
    void refreshToken()
      .catch(() => null)
      .then((info) => {
        refreshing = false;
        if (!info || info.accessToken === handshakeToken) return;
        storeTokens(info);
        socket.disconnect().connect();
      });
  };
  socket.on('exception', onException);

  const interval = setInterval(reconnectIfExpired, EXPIRY_CHECK_INTERVAL);

  return {
    reconnectIfExpired,
    stop: () => {
      clearInterval(interval);
      socket.off('exception', onException);
    },
  };
}
