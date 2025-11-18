import { API_BASE_URL } from '@/config';
import { getAccessToken, isTokenExpiringSoon } from '@/utils/auth';
import { ACCESS_TOKEN, getItem, setItem } from '@/utils/local-storage';
import { Socket, io } from 'socket.io-client';

export interface TrainingLoadEstimationStartedPayload {
  eventId: number;
  athleteId: number;
}

export interface TrainingLoadEstimationCompletedPayload {
  eventId: number;
  athleteId: number;
  estimatedLoad: number;
}

export interface TrainingLoadEstimationFailedPayload {
  eventId: number;
  athleteId: number;
  error: string;
}

export interface ActivityProcessedPayload {
  eventId: number;
  athleteId: number;
}

export interface WeeklyLoadUpdatedPayload {
  athleteId: number;
  eventId?: number;
  reason?: 'event_deleted' | 'event_updated';
}

export type CalendarWebSocketEvent =
  | {
      type: 'training_load_estimation_started';
      payload: TrainingLoadEstimationStartedPayload;
    }
  | {
      type: 'training_load_estimation_completed';
      payload: TrainingLoadEstimationCompletedPayload;
    }
  | {
      type: 'training_load_estimation_failed';
      payload: TrainingLoadEstimationFailedPayload;
    }
  | { type: 'activity_processed'; payload: ActivityProcessedPayload }
  | { type: 'weekly_load_updated'; payload: WeeklyLoadUpdatedPayload };

export class CalendarAPI {
  private static socket: Socket | null = null;
  private static tokenRefreshInterval: NodeJS.Timeout | null = null;
  private static connectingPromise: Promise<void> | null = null;
  private static readonly TOKEN_REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  static getSocket(): Socket {
    if (!this.socket) {
      const token = getItem(ACCESS_TOKEN);

      this.socket = io(`${API_BASE_URL}/calendar`, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        upgrade: true,
        rememberUpgrade: true,
        auth: {
          token: token || '',
        },
        extraHeaders: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      // Handle session errors by forcing a fresh connection
      this.socket.io.on('error', (error: unknown) => {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : '';
        const errorData =
          error && typeof error === 'object' && 'data' in error
            ? error.data
            : null;

        // Check for session ID unknown errors (common in multi-instance setups)
        if (
          errorMessage.includes('Session ID unknown') ||
          (errorData &&
            typeof errorData === 'object' &&
            'code' in errorData &&
            errorData.code === 1)
        ) {
          // Disconnect and clear socket to force a fresh connection
          const oldSocket = this.socket;
          this.socket = null;
          if (oldSocket) {
            oldSocket.disconnect();
            oldSocket.removeAllListeners();
          }
          // Next getSocket() call will create a fresh socket
        }
      });

      // Set up token refresh mechanism
      this.setupTokenRefresh();
    }
    return this.socket;
  }

  private static async refreshSocketToken(): Promise<boolean> {
    try {
      const tokenInfo = await getAccessToken();
      if (!tokenInfo) {
        return false;
      }

      // Update stored tokens
      if (tokenInfo.refreshToken) {
        setItem(ACCESS_TOKEN, tokenInfo.accessToken);
      }

      const socket = this.socket;
      if (!socket) {
        return false;
      }

      // Update socket auth and headers for future connections
      socket.auth = {
        token: tokenInfo.accessToken,
      };
      socket.io.opts.extraHeaders = {
        Authorization: `Bearer ${tokenInfo.accessToken}`,
      };

      return true;
    } catch (error) {
      console.error('[CalendarAPI] Failed to refresh token:', error);
      return false;
    }
  }

  private static setupTokenRefresh(): void {
    // Clear existing interval if any
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Check token expiration periodically
    this.tokenRefreshInterval = setInterval(async () => {
      const token = getItem(ACCESS_TOKEN);
      if (!token) {
        return;
      }

      // If token is expiring soon (within 5 minutes), refresh it
      if (isTokenExpiringSoon(token, 5)) {
        await this.refreshSocketToken();
      }
    }, this.TOKEN_REFRESH_CHECK_INTERVAL);
  }

  static async connectSocket(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    const socket = this.getSocket();
    if (socket.connected) {
      return;
    }

    this.connectingPromise = (async () => {
      try {
        // Ensure we have a valid token before connecting
        const tokenInfo = await getAccessToken();
        if (!tokenInfo) {
          console.error(
            '[CalendarAPI] No valid token available for connection',
          );
          return;
        }

        if (tokenInfo.refreshToken) {
          setItem(ACCESS_TOKEN, tokenInfo.accessToken);
        }

        socket.auth = {
          token: tokenInfo.accessToken,
        };
        socket.io.opts.extraHeaders = {
          Authorization: `Bearer ${tokenInfo.accessToken}`,
        };
        socket.connect();
      } finally {
        // Clear the promise after a short delay to allow connection to establish
        setTimeout(() => {
          this.connectingPromise = null;
        }, 1000);
      }
    })();

    return this.connectingPromise;
  }

  static disconnectSocket(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
    this.connectingPromise = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  static subscribe(athleteId?: number): void {
    const socket = this.getSocket();
    socket.emit('subscribe', { athleteId });
  }

  static unsubscribe(athleteId?: number): void {
    const socket = this.getSocket();
    socket.emit('unsubscribe', { athleteId });
  }

  static onEvent(
    callback: (event: CalendarWebSocketEvent) => void,
  ): () => void {
    const socket = this.getSocket();

    const handlers = {
      training_load_estimation_started: (
        payload: TrainingLoadEstimationStartedPayload,
      ) => {
        callback({ type: 'training_load_estimation_started', payload });
      },
      training_load_estimation_completed: (
        payload: TrainingLoadEstimationCompletedPayload,
      ) => {
        callback({ type: 'training_load_estimation_completed', payload });
      },
      training_load_estimation_failed: (
        payload: TrainingLoadEstimationFailedPayload,
      ) => {
        callback({ type: 'training_load_estimation_failed', payload });
      },
      activity_processed: (payload: ActivityProcessedPayload) => {
        callback({ type: 'activity_processed', payload });
      },
      weekly_load_updated: (payload: WeeklyLoadUpdatedPayload) => {
        callback({ type: 'weekly_load_updated', payload });
      },
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Return cleanup function
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }
}
