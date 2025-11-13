import { API_BASE_URL } from '@/config';
import { getAccessToken, isTokenExpiringSoon } from '@/utils/auth';
import client, { routes } from '@/utils/axios';
import { ACCESS_TOKEN, getItem, setItem } from '@/utils/local-storage';
import { Socket, io } from 'socket.io-client';

import {
  CreateMessageThreadDto,
  CreateMessageThreadMessageDto,
  MarkMessagesAsReadDto,
  Message,
  MessageThread,
  UpdateMessageThreadDto,
  UpdateMessageThreadMessageDto,
} from '@openathlete/shared';

export class MessagesAPI {
  private static socket: Socket | null = null;
  private static tokenRefreshInterval: NodeJS.Timeout | null = null;
  private static connectingPromise: Promise<void> | null = null;
  private static readonly TOKEN_REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  // ==================== REST API Methods ====================

  // Thread operations
  static async createThread(
    body: CreateMessageThreadDto,
  ): Promise<MessageThread> {
    const res = await client.post(routes.messages.createThread, body);
    return res.data;
  }

  static async getThread(threadId: number): Promise<MessageThread> {
    const res = await client.get(routes.messages.getThread(threadId));
    return res.data;
  }

  static async getUserThreads(): Promise<MessageThread[]> {
    const res = await client.get(routes.messages.getThreads);
    return res.data;
  }

  static async updateThread({
    threadId,
    body,
  }: {
    threadId: number;
    body: UpdateMessageThreadDto;
  }): Promise<MessageThread> {
    const res = await client.put(routes.messages.updateThread(threadId), body);
    return res.data;
  }

  static async deleteThread(threadId: number): Promise<void> {
    await client.delete(routes.messages.deleteThread(threadId));
  }

  // Message operations
  static async createMessage(
    body: CreateMessageThreadMessageDto,
  ): Promise<Message> {
    const res = await client.post(routes.messages.createMessage, body);
    return res.data;
  }

  static async getThreadMessages(threadId: number): Promise<Message[]> {
    const res = await client.get(routes.messages.getThreadMessages(threadId));
    return res.data;
  }

  static async getMessage(messageId: number): Promise<Message> {
    const res = await client.get(routes.messages.getMessage(messageId));
    return res.data;
  }

  static async updateMessage({
    messageId,
    body,
  }: {
    messageId: number;
    body: UpdateMessageThreadMessageDto;
  }): Promise<Message> {
    const res = await client.put(
      routes.messages.updateMessage(messageId),
      body,
    );
    return res.data;
  }

  static async deleteMessage(messageId: number): Promise<void> {
    await client.delete(routes.messages.deleteMessage(messageId));
  }

  // Read receipt operations
  static async markMessagesAsRead(
    threadId: number,
    body: MarkMessagesAsReadDto,
  ): Promise<void> {
    await client.post(routes.messages.markAsRead(threadId), body);
  }

  // ==================== WebSocket Methods ====================

  static getSocket(): Socket {
    if (!this.socket) {
      // Get JWT token from localStorage using project's auth utils
      const token = getItem(ACCESS_TOKEN);

      this.socket = io(`${API_BASE_URL}/messages`, {
        transports: ['polling', 'websocket'], // Allow polling first, then upgrade to websocket
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Retry indefinitely in production
        upgrade: true, // Allow upgrade from polling to websocket
        rememberUpgrade: true, // Remember transport preference
        auth: {
          token: token || '',
        },
        // Also send token in headers as fallback
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
          console.warn(
            '[MessagesAPI] Session error detected, forcing reconnection',
          );
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
      console.error('[MessagesAPI] Failed to refresh token:', error);
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
            '[MessagesAPI] No valid token available for connection',
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

  static joinThread(messageThreadId: number): void {
    const socket = this.getSocket();
    socket.emit('join_thread', { messageThreadId });
  }

  static leaveThread(messageThreadId: number): void {
    const socket = this.getSocket();
    socket.emit('leave_thread', { messageThreadId });
  }

  static sendMessage(messageThreadId: number, content: string): void {
    const socket = this.getSocket();
    socket.emit('send_message', { messageThreadId, content });

    if (!socket.connected) {
      this.connectSocket();
    }
  }

  static updateMessageViaSocket(messageId: number, content: string): void {
    const socket = this.getSocket();
    socket.emit('update_message', { messageId, content });
  }

  static markAsRead(messageThreadId: number, messageIds?: number[]): void {
    const socket = this.getSocket();
    socket.emit('mark_as_read', { messageThreadId, messageIds });
  }
}
