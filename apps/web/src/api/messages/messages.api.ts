import { API_BASE_URL } from '@/config';
import client, { routes } from '@/utils/axios';
import { ACCESS_TOKEN, getItem } from '@/utils/local-storage';
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
        reconnectionAttempts: 5,
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
    }
    return this.socket;
  }

  static connectSocket(): void {
    const socket = this.getSocket();
    if (!socket.connected) {
      const token = getItem(ACCESS_TOKEN);
      if (!token) {
        return;
      }
      socket.auth = { token };
      socket.connect();
    }
  }

  static disconnectSocket(): void {
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
