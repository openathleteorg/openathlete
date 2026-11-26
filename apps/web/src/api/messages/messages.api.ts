import { socketUrl } from '@/config';
import { getAccessToken } from '@/utils/auth';
import { captureAuthSession } from '@/utils/auth-attempt';
import client, { routes } from '@/utils/axios';
import {
  type SocketAuthentication,
  keepSocketAuthenticated,
  socketSessionKey,
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
  private static socketErrorHandler: ((error: unknown) => void) | null = null;
  private static connectingPromise: Promise<void> | null = null;
  private static connectingSocket: Socket | null = null;
  private static connectingAttempt: object | null = null;
  private static socketSessionKey: string | null = null;

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
    const session = captureAuthSession();
    const sessionKey = socketSessionKey(session);
    if (this.socket && this.socketSessionKey !== sessionKey) {
      // Never reuse account A's handshake for account B or another instance.
      this.disconnectSocket();
    }
    if (!this.socket) {
      const socket = io(socketUrl('messages'), {
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
      this.socket = socket;
      this.socketSessionKey = sessionKey;
      this.socketAuth = keepSocketAuthenticated(socket, session);

      // Bound to this exact socket and detached when it is disposed, so a
      // late manager error from a replaced socket cannot clear the successor.
      const onManagerError = (error: unknown) => {
        if (this.socket !== socket) return;
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : '';
        const errorData =
          error && typeof error === 'object' && 'data' in error
            ? error.data
            : null;
        if (
          errorMessage.includes('Session ID unknown') ||
          (errorData &&
            typeof errorData === 'object' &&
            'code' in errorData &&
            errorData.code === 1)
        ) {
          this.disposeSocket(socket);
        }
      };
      this.socketErrorHandler = onManagerError;
      socket.io.on('error', onManagerError);
    }
    return this.socket;
  }

  /** Detach everything that belongs to one socket, and only that socket. */
  private static disposeSocket(socket: Socket): void {
    if (this.socket === socket) {
      if (this.socketErrorHandler) {
        socket.io.off('error', this.socketErrorHandler);
        this.socketErrorHandler = null;
      }
      this.socketAuth?.stop();
      this.socketAuth = null;
      this.socketSessionKey = null;
      this.connectingPromise = null;
      this.connectingSocket = null;
      this.connectingAttempt = null;
      this.socket = null;
    }
    socket.disconnect();
    socket.removeAllListeners();
  }

  static async connectSocket(): Promise<void> {
    const socket = this.getSocket();
    if (socket.connected) {
      return;
    }
    // A pending attempt belongs only to the socket it was started for. A newer
    // login may already have replaced that socket and started its own work.
    if (this.connectingPromise && this.connectingSocket === socket) {
      return this.connectingPromise;
    }

    // Each call is its own attempt. Timers and continuations compare this
    // identity, not only the socket: a retry on the same socket must survive
    // the failed attempt's cleanup.
    const attempt = {};
    const connection = (async () => {
      try {
        // Ensure we have a valid token before connecting
        const tokenInfo = await getAccessToken();
        if (this.socket !== socket || this.connectingAttempt !== attempt)
          return;
        if (!tokenInfo) {
          console.error(
            '[MessagesAPI] No valid token available for connection',
          );
          return;
        }

        socket.connect();
      } catch (error) {
        // Let the next connect attempt start immediately instead of returning
        // this failed promise until the cleanup timer fires.
        if (this.connectingAttempt === attempt) {
          this.connectingPromise = null;
          this.connectingSocket = null;
          this.connectingAttempt = null;
        }
        throw error;
      } finally {
        // Clear only this attempt after a short delay to allow the connection
        // to establish; stale cleanup must not erase newer work.
        setTimeout(() => {
          if (this.connectingAttempt !== attempt) return;
          this.connectingPromise = null;
          this.connectingSocket = null;
          this.connectingAttempt = null;
        }, 1000);
      }
    })();

    this.connectingPromise = connection;
    this.connectingSocket = socket;
    this.connectingAttempt = attempt;
    return connection;
  }

  static disconnectSocket(): void {
    if (this.socket) this.disposeSocket(this.socket);
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
