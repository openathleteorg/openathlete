import { API_BASE_URL } from '@/config';
import client, { routes } from '@/utils/axios';
import { ACCESS_TOKEN, getItem } from '@/utils/local-storage';
import { Socket, io } from 'socket.io-client';

import {
  AgentMessage,
  AgentThread,
  CreateMessageDto,
  CreateThreadDto,
  SendMessageDto,
  UpdateThreadDto,
} from '@openathlete/shared';

export class AgentAPI {
  private static socket: Socket | null = null;

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

  static getSocket(): Socket {
    if (!this.socket) {
      const token = getItem(ACCESS_TOKEN);

      this.socket = io(`${API_BASE_URL}/agent`, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        autoConnect: false,
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
    }
    return this.socket;
  }

  static connectSocket(): void {
    const socket = this.getSocket();
    if (!socket.connected) {
      const token = getItem(ACCESS_TOKEN);
      socket.auth = {
        token: token || '',
      };
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

  static sendMessageStream(threadId: number, content: string): void {
    const socket = this.getSocket();
    socket.emit('send_message', { threadId, content });
  }
}
