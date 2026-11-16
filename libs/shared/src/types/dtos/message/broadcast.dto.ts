import { z } from 'zod';

/** A club's group at most: past that, write to groups one by one */
export const BROADCAST_MAX_RECIPIENTS = 200;
export const BROADCAST_CONTENT_MAX = 10000;
/** How far ahead a message can wait */
export const SCHEDULE_MAX_DAYS = 365;

export const BROADCAST_MODES = ['INDIVIDUAL', 'GROUP'] as const;
export const broadcastModeSchema = z.enum(BROADCAST_MODES);
export type BroadcastMode = z.infer<typeof broadcastModeSchema>;

export const sendBroadcastDtoSchema = z.object({
  /** Users to write to: athletes the sender coaches, or their coaches */
  recipientUserIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(BROADCAST_MAX_RECIPIENTS),
  content: z.string().trim().min(1).max(BROADCAST_CONTENT_MAX),
  /**
   * INDIVIDUAL by default: each recipient gets it in their conversation
   * with the sender, and answers in private. GROUP opens one conversation
   * where everyone sees the others' names.
   */
  mode: broadcastModeSchema.default('INDIVIDUAL'),
  /** Title of a group conversation */
  title: z.string().trim().min(1).max(120).optional(),
  /** Absent: sent now. In the future: sent then, by the server. */
  sendAt: z.coerce.date().optional(),
});
export type SendBroadcastDto = z.infer<typeof sendBroadcastDtoSchema>;

export const sendBroadcastResultSchema = z.object({
  /** Conversations the message went to; empty when scheduled */
  messageThreadIds: z.array(z.number()),
  /** Set when the message waits for its time */
  scheduledMessageId: z.number().nullable(),
});
export type SendBroadcastResultDto = z.infer<typeof sendBroadcastResultSchema>;

export const scheduledMessageSchema = z.object({
  scheduledMessageId: z.number(),
  content: z.string(),
  mode: broadcastModeSchema,
  title: z.string().nullable(),
  sendAt: z.coerce.date(),
  recipients: z.array(
    z.object({
      userId: z.number(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
});
export type ScheduledMessageDto = z.infer<typeof scheduledMessageSchema>;

export const updateScheduledMessageDtoSchema = z.object({
  content: z.string().trim().min(1).max(BROADCAST_CONTENT_MAX).optional(),
  sendAt: z.coerce.date().optional(),
});
export type UpdateScheduledMessageDto = z.infer<
  typeof updateScheduledMessageDtoSchema
>;

export const scheduledMessageParamsSchema = z.object({
  scheduledMessageId: z.coerce.number().int().positive(),
});
export type ScheduledMessageParamsDto = z.infer<
  typeof scheduledMessageParamsSchema
>;
