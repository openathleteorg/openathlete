import { socketUrl } from '@/config';
import { getAccessToken } from '@/utils/auth';
import client, { routes } from '@/utils/axios';
import { ACCESS_TOKEN, setItem } from '@/utils/local-storage';
import {
  type SocketAuthentication,
  keepSocketAuthenticated,
} from '@/utils/socket-auth';
import { Socket, io } from 'socket.io-client';

import {
  CreateMessageThreadDto,
  CreateMessageThreadMessageDto,
  MarkMessagesAsReadDto,
  Message,
  MessageThread,
  ScheduledMessageDto,
  SendBroadcastDto,
  SendBroadcastResultDto,
  UpdateMessageThreadDto,
  UpdateMessageThreadMessageDto,
  UpdateScheduledMessageDto,
} from '@openathlete/shared';

export class MessagesAPI {
  private static socket: Socket | null = null;
  private static socketAuth: SocketAuthentication | null = null;
  private static connectingPromise: Promise<void> | null = null;

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
      this.socket = io(socketUrl('messages'), {
        transports: ['polling', 'websocket'], // Allow polling first, then upgrade to websocket
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Retry indefinitely in production
        upgrade: true, // Allow upgrade from polling to websocket
        rememberUpgrade: true, // Remember transport preference
      });
      this.socketAuth = keepSocketAuthenticated(this.socket);

      this.socket.io.on(
        'error',
        (error: Error & { data?: { code: number } }) => {
          if (
            error?.message?.includes('Session ID unknown') ||
            (error?.data &&
              typeof error.data === 'object' &&
              error.data.code === 1)
          ) {
            const oldSocket = this.socket;
            this.socket = null;
            this.socketAuth?.stop();
            this.socketAuth = null;
            if (oldSocket) {
              oldSocket.disconnect();
              oldSocket.removeAllListeners();
            }
          }
        },
      );
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
            '[MessagesAPI] No valid token available for connection',
          );
          return;
        }

        if (tokenInfo.refreshToken) {
          setItem(ACCESS_TOKEN, tokenInfo.accessToken);
        }

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
  private static emit(event: string, data: unknown): Socket {
    const socket = this.getSocket();
    this.socketAuth?.reconnectIfExpired();
    socket.emit(event, data);
    return socket;
  }

  static joinThread(messageThreadId: number): void {
    this.emit('join_thread', { messageThreadId });
  }

  static leaveThread(messageThreadId: number): void {
    this.emit('leave_thread', { messageThreadId });
  }

  static sendMessage(messageThreadId: number, content: string): void {
    const socket = this.emit('send_message', { messageThreadId, content });

    if (!socket.connected) {
      this.connectSocket();
    }
  }

  static updateMessageViaSocket(messageId: number, content: string): void {
    this.emit('update_message', { messageId, content });
  }

  static markAsRead(messageThreadId: number, messageIds?: number[]): void {
    this.emit('mark_as_read', { messageThreadId, messageIds });
  }

  /** One message to several people, now or at sendAt */
  static async sendBroadcast(
    body: SendBroadcastDto,
  ): Promise<SendBroadcastResultDto> {
    return (await client.post(routes.messages.broadcast, body)).data;
  }

  static async getScheduled(): Promise<ScheduledMessageDto[]> {
    return (await client.get(routes.messages.scheduled)).data;
  }

  static async updateScheduled({
    scheduledMessageId,
    body,
  }: {
    scheduledMessageId: number;
    body: UpdateScheduledMessageDto;
  }): Promise<void> {
    await client.patch(
      routes.messages.scheduledMessage(scheduledMessageId),
      body,
    );
  }

  static async cancelScheduled(scheduledMessageId: number): Promise<void> {
    await client.delete(routes.messages.scheduledMessage(scheduledMessageId));
  }
}
