import { socketUrl } from '@/config';
import { getAccessToken } from '@/utils/auth';
import { ACCESS_TOKEN, setItem } from '@/utils/local-storage';
import {
  type SocketAuthentication,
  keepSocketAuthenticated,
} from '@/utils/socket-auth';
import { Socket, io } from 'socket.io-client';

export interface TrainingLoadEstimationStartedPayload {
  eventId: number;
  athleteId: number;
}

export interface TrainingLoadEstimationCompletedPayload {
  eventId: number;
  athleteId: number;
  estimatedLoad: number | null;
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
  private static socketAuth: SocketAuthentication | null = null;
  private static connectingPromise: Promise<void> | null = null;

  static getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(socketUrl('calendar'), {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000, // Increased max delay to 10s for better stability
        reconnectionAttempts: Infinity,
        upgrade: true,
        rememberUpgrade: true,
        // Improved connection stability settings
        timeout: 45000, // Connection timeout (matches server)
        // Socket.IO will handle ping/pong automatically
      });
      this.socketAuth = keepSocketAuthenticated(this.socket);

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
          this.socketAuth?.stop();
          this.socketAuth = null;
          if (oldSocket) {
            oldSocket.disconnect();
            oldSocket.removeAllListeners();
          }
          // Next getSocket() call will create a fresh socket
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('[CalendarAPI] Connection error:', error.message);
      });
    }
    return this.socket;
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
          this.connectingPromise = null;
          return;
        }

        if (tokenInfo.refreshToken) {
          setItem(ACCESS_TOKEN, tokenInfo.accessToken);
        }

        // Connect the socket
        socket.connect();
      } catch (error) {
        console.error('[CalendarAPI] Error connecting socket:', error);
        this.connectingPromise = null;
        throw error;
      } finally {
        // Clear the promise after a delay to allow connection to establish
        setTimeout(() => {
          this.connectingPromise = null;
        }, 2000);
      }
    })();

    return this.connectingPromise;
  }

  static disconnectSocket(): void {
    this.socketAuth?.stop();
    this.socketAuth = null;
    this.connectingPromise = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Reconnects first when the token expired: the server would refuse the
  // event, and Socket.IO sends it once connected again
  static subscribe(athleteId?: number): void {
    const socket = this.getSocket();
    this.socketAuth?.reconnectIfExpired();
    socket.emit('subscribe', { athleteId });
  }

  static unsubscribe(athleteId?: number): void {
    const socket = this.getSocket();
    this.socketAuth?.reconnectIfExpired();
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
