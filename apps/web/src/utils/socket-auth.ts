import type { Socket } from 'socket.io-client';

import { getAccessToken, isValidToken, refreshToken } from './auth';
import { type AuthSessionSnapshot, captureAuthSession } from './auth-attempt';

const EXPIRY_CHECK_INTERVAL = 60 * 1000;

/** The login and instance a cached socket belongs to; refresh rotation keeps it. */
export function socketSessionKey(
  session: AuthSessionSnapshot = captureAuthSession(),
): string {
  return `${session.owner}|${session.instanceURL}`;
}

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
export function keepSocketAuthenticated(
  socket: Socket,
  session: AuthSessionSnapshot = captureAuthSession(),
): SocketAuthentication {
  let handshakeToken: string | null = null;
  let refreshing = false;
  let stopped = false;
  // The connection keeps its owner and instance, but every handshake and
  // refresh must use the exact credential generation installed now: a socket
  // that saw generation 1 rotate 2 must be able to rotate 3 later.
  const connectionSession = (): AuthSessionSnapshot | null => {
    const current = captureAuthSession();
    return current.owner === session.owner &&
      current.instanceURL === session.instanceURL
      ? current
      : null;
  };
  const belongsToConnection = () => !stopped && connectionSession() !== null;

  socket.auth = (send) => {
    const active = stopped ? null : connectionSession();
    if (!active) return;
    void getAccessToken(active)
      .catch(() => null)
      .then((info) => {
        // Auth owns credential writes. A late answer for a previous owner
        // must neither install its refresh nor hand this socket its token;
        // an empty token would still make the stale socket look connected.
        if (!info?.accessToken || !belongsToConnection()) return;
        handshakeToken = info.accessToken;
        send({ token: handshakeToken });
      });
  };

  const reconnectIfExpired = () => {
    if (!belongsToConnection()) return;
    if (socket.connected && handshakeToken && !isValidToken(handshakeToken)) {
      socket.disconnect().connect();
    }
  };

  // The server refused an event because the token expired, whatever the
  // device's clock says. Reconnecting only with a new token avoids a loop
  // once the refresh token is no longer valid.
  const onException = (error: { message?: unknown }) => {
    const active = stopped ? null : connectionSession();
    if (
      refreshing ||
      !active ||
      typeof error?.message !== 'string' ||
      !error.message.includes('jwt expired')
    ) {
      return;
    }
    refreshing = true;
    void refreshToken(active)
      .catch(() => null)
      .then((info) => {
        refreshing = false;
        if (!info || !belongsToConnection()) return;
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
      stopped = true;
      clearInterval(interval);
      socket.off('exception', onException);
    },
  };
}
