import { Message, MessageThread } from '@openathlete/shared';

/**
 * Calculate the number of unread messages in a thread for the current user
 */
export function calculateUnreadCount(
  thread: MessageThread,
  currentUserId: number,
): number {
  if (!thread.messages || thread.messages.length === 0) {
    return 0;
  }

  // Count messages that:
  // 1. Are not sent by the current user
  // 2. Don't have a read receipt from the current user
  return thread.messages.filter(
    (message: Message) =>
      message.senderId !== currentUserId &&
      !message.readReceipts?.some((rr) => rr.userId === currentUserId),
  ).length;
}

/**
 * Calculate total unread count across all threads
 */
export function calculateTotalUnreadCount(
  threads: MessageThread[],
  currentUserId: number,
): number {
  return threads.reduce(
    (total, thread) => total + calculateUnreadCount(thread, currentUserId),
    0,
  );
}

