import { API_BASE_URL } from '@/config';
import { getAccessToken, isTokenExpiringSoon } from '@/utils/auth';
import client, { routes } from '@/utils/axios';
import { ACCESS_TOKEN, getItem, setItem } from '@/utils/local-storage';
import { Socket, io } from 'socket.io-client';

import {
  AgentMessage,
  AgentThread,
  CreateMessageDto,
  CreateThreadDto,
  UpdateThreadDto,
} from '@openathlete/shared';

export class AgentAPI {
  private static socket: Socket | null = null;
  private static tokenRefreshInterval: NodeJS.Timeout | null = null;
  private static connectingPromise: Promise<void> | null = null;
  private static readonly TOKEN_REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  static async createThread(body: CreateThreadDto): Promise<AgentThread> {
    const res = await client.post(routes.agent.createThread, body);
    return res.data;
  }

  static async getThread(threadId: number): Promise<AgentThread> {
    const res = await client.get(routes.agent.getThread(threadId));
    return res.data;
  }

  static async getUserThreads(): Promise<AgentThread[]> {
    const res = await client.get(routes.agent.getThreads);
    return res.data;
  }

  static async updateThread({
    threadId,
    body,
  }: {
    threadId: number;
    body: UpdateThreadDto;
  }): Promise<AgentThread> {
    const res = await client.put(routes.agent.updateThread(threadId), body);
    return res.data;
  }

  static async deleteThread(threadId: number): Promise<void> {
    await client.delete(routes.agent.deleteThread(threadId));
  }

  static async createMessage(body: CreateMessageDto): Promise<AgentMessage> {
    const res = await client.post(routes.agent.createMessage, body);
    return res.data;
  }

  static async getThreadMessages(threadId: number): Promise<AgentMessage[]> {
    const res = await client.get(routes.agent.getThreadMessages(threadId));
    return res.data;
  }

  static async deleteMessage(messageId: number): Promise<void> {
    await client.delete(routes.agent.deleteMessage(messageId));
  }

  static getSocket(): Socket {
    if (!this.socket) {
      const token = getItem(ACCESS_TOKEN);

      this.socket = io(`${API_BASE_URL}/agent`, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Retry indefinitely in production
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
      this.socket.io.on('error', (error: any) => {
        // Check for session ID unknown errors (common in multi-instance setups)
        if (
          error?.message?.includes('Session ID unknown') ||
          (error?.data &&
            typeof error.data === 'object' &&
            error.data.code === 1)
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

      // Don't disconnect/reconnect - let Socket.IO handle reconnection naturally
      // If the connection fails due to expired token, Socket.IO will reconnect
      // with the new token automatically

      return true;
    } catch (error) {
      console.error('[AgentAPI] Failed to refresh token:', error);
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
          console.error('[AgentAPI] No valid token available for connection');
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

  static joinThread(threadId: number): void {
    const socket = this.getSocket();
    socket.emit('join_thread', { threadId });
  }

  static leaveThread(threadId: number): void {
    const socket = this.getSocket();
    socket.emit('leave_thread', { threadId });
  }

  static sendMessageStream(threadId: number, content: string): void {
    const socket = this.getSocket();
    socket.emit('send_message', { threadId, content });
  }
}
