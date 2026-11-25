import type { Socket } from 'socket.io-client';

import { getAccessToken, isValidToken, refreshToken } from './auth';
import { captureAuthSession, isAuthSessionCurrent } from './auth-attempt';

const EXPIRY_CHECK_INTERVAL = 60 * 1000;

export type SocketAuthentication = {
  /** Reconnects with a fresh token when the one of the handshake expired. */
  reconnectIfExpired: () => void;
  stop: () => void;
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
    const session = captureAuthSession();
    void getAccessToken(session)
      .catch(() => null)
      .then((info) => {
        // Auth owns credential writes. A late answer for a previous owner
        // must neither install its refresh nor hand this socket its token.
        if (!isAuthSessionCurrent(session)) {
          handshakeToken = null;
          send({ token: '' });
          return;
        }
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
    const session = captureAuthSession();
    void refreshToken(session)
      .catch(() => null)
      .then((info) => {
        refreshing = false;
        if (!info || !isAuthSessionCurrent(session)) return;
        if (info.accessToken === handshakeToken) return;
        handshakeToken = info.accessToken;
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
