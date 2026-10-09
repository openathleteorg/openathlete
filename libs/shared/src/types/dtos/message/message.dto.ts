import { z } from 'zod';

import { ActivityChatNoticeDto } from './activity-alert.dto';

// ============================================================================
// Messaging System Types and DTOs
// ============================================================================
// Separate from agent types - this is for human-to-human messaging
// between athletes and coaches
// ============================================================================

// Message Thread Types
export interface MessageThread {
  messageThreadId: number;
  title?: string;
  eventTrainingId?: number;
  eventActivityId?: number | null;
  createdAt: string;
  updatedAt: string;
  participants?: MessageThreadParticipant[];
  messages?: Message[];
  unreadCount?: number; // Computed field for current user
  lastMessage?: Message; // Computed field
}

export interface MessageThreadParticipant {
  messageThreadParticipantId: number;
  messageThreadId: number;
  userId: number;
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Message Types
export interface Message {
  activityNotice?: ActivityChatNoticeDto | null;
  messageId: number;
  messageThreadId: number;
  senderId: number;
  content: string;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  readReceipts?: MessageReadReceipt[];
  isRead?: boolean; // Computed field for current user
}

export interface MessageReadReceipt {
  messageReadReceiptId: number;
  messageId: number;
  userId: number;
  readAt: string;
  user?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ============================================================================
// DTOs
// ============================================================================

// Thread DTOs
export const createMessageThreadDtoSchema = z.object({
  title: z.string().optional(),
  eventActivityId: z.number().int().positive().optional(),
  participantUserIds: z.array(z.number().int().positive()).min(1),
});

export const updateMessageThreadDtoSchema = z.object({
  title: z.string().optional(),
});

export type CreateMessageThreadDto = z.infer<
  typeof createMessageThreadDtoSchema
>;
export type UpdateMessageThreadDto = z.infer<
  typeof updateMessageThreadDtoSchema
>;

// Message DTOs
export const createMessageThreadMessageDtoSchema = z.object({
  messageThreadId: z.number().int().positive(),
  content: z.string().min(1).max(10000), // Limit message size to 10KB
});

export const updateMessageThreadMessageDtoSchema = z.object({
  content: z.string().min(1).max(10000), // Limit message size to 10KB
});

export type CreateMessageThreadMessageDto = z.infer<
  typeof createMessageThreadMessageDtoSchema
>;
export type UpdateMessageThreadMessageDto = z.infer<
  typeof updateMessageThreadMessageDtoSchema
>;

// Read Receipt DTOs
export const markMessagesAsReadDtoSchema = z.object({
  messageThreadId: z.number().int().positive(),
  messageIds: z.array(z.number().int().positive()).optional(), // If empty, mark all as read
});

export type MarkMessagesAsReadDto = z.infer<typeof markMessagesAsReadDtoSchema>;

/** A comment on a planned session or an activity, as the calendar shows it */
export type EventComment = {
  messageId: number;
  content: string;
  createdAt: Date;
  sender: { userId: number; firstName: string; lastName: string };
  /** Written by the user reading it */
  mine: boolean;
};

export type EventComments = {
  comments: EventComment[];
  /** Comments of others since the user last read them */
  unread: number;
};

/** Comments of each commented event of a calendar range */
export type EventCommentCount = {
  eventId: number;
  count: number;
  unread: number;
};

export const addEventCommentDtoSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export type AddEventCommentDto = z.infer<typeof addEventCommentDtoSchema>;
