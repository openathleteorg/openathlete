import { API_BASE_URL } from '@/config';
import client, { routes } from '@/utils/axios';
import { Socket, io } from 'socket.io-client';

import {
  AgentMessage,
  AgentMessageBlock,
  AgentThread,
  CreateBlockDto,
  CreateMessageDto,
  CreateThreadDto,
  SendMessageDto,
  UpdateBlockDto,
  UpdateThreadDto,
} from '@openathlete/shared';

export class AgentService {
  private static socket: Socket | null = null;

  // ==================== REST API Methods ====================

  // Thread operations
  static async createThread(body: CreateThreadDto): Promise<AgentThread> {
    const res = await client.post(routes.agent.createThread, body);
    return res.data;
  }

  static async getThread(threadId: number): Promise<AgentThread> {
    const res = await client.get(routes.agent.getThread(threadId));
    return res.data;
  }

  static async getUserThreads(): Promise<AgentThread[]> {
    const res = await client.get(routes.agent.getUserThreads);
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

  // Message operations
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

  // Block operations
  static async createBlock(body: CreateBlockDto): Promise<AgentMessageBlock> {
    const res = await client.post(routes.agent.createBlock, body);
    return res.data;
  }

  static async updateBlock({
    blockId,
    body,
  }: {
    blockId: number;
    body: UpdateBlockDto;
  }): Promise<AgentMessageBlock> {
    const res = await client.put(routes.agent.updateBlock(blockId), body);
    return res.data;
  }

  static async deleteBlock(blockId: number): Promise<void> {
    await client.delete(routes.agent.deleteBlock(blockId));
  }

  // Chat endpoint (non-streaming)
  static async sendMessage({
    threadId,
    body,
  }: {
    threadId: number;
    body: SendMessageDto;
  }): Promise<AgentMessage> {
    const res = await client.post(routes.agent.chat(threadId), body);
    return res.data;
  }

  // ==================== WebSocket Methods ====================

  static getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(`${API_BASE_URL}/agent`, {
        transports: ['websocket'],
        withCredentials: true,
        autoConnect: false,
      });
    }
    return this.socket;
  }

  static connectSocket(): void {
    const socket = this.getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }

  static disconnectSocket(): void {
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

  static sendMessageStream(
    threadId: number,
    content: string,
    userId: number,
  ): void {
    const socket = this.getSocket();
    console.log('[AgentService] Emitting send_message:', {
      threadId,
      content,
      userId,
    });
    socket.emit('send_message', { threadId, content, userId });
  }
}
