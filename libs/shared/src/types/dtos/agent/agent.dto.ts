import { z } from 'zod';

// Enums matching Prisma
export const AgentBlockType = z.enum([
  'TEXT',
  'THINKING',
  'TOOL_CALL',
  'TOOL_RESULT',
  'CODE',
  'CHART_LINE',
  'CHART_BAR',
  'CHART_PIE',
  'CHART_SCATTER',
  'CHART_AREA',
  'TABLE',
  'MAP',
  'ACTIVITY_SUMMARY',
  'ACTIVITY_LIST',
  'ACTIVITY_CREATED',
  'TRAINING_PLAN',
  'ERROR',
  'IMAGE',
  'FILE',
]);

export const AgentMessageRole = z.enum(['USER', 'ASSISTANT', 'SYSTEM', 'TOOL']);
export const AgentBlockStatus = z.enum([
  'pending',
  'processing',
  'completed',
  'error',
  'cancelled',
]);

export const AgentMessageStatus = z.enum([
  'pending',
  'processing',
  'completed',
  'error',
]);

export interface AgentMessageBlock {
  blockId: number;
  messageId: number;
  type: z.infer<typeof AgentBlockType>;
  order: number;
  content: string;
  metadata?: Record<string, unknown>;
  status: z.infer<typeof AgentBlockStatus>;
  error?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  chartType?: string;
  chartData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  messageId: number;
  threadId: number;
  role: z.infer<typeof AgentMessageRole>;
  status: z.infer<typeof AgentMessageStatus>;
  metadata?: Record<string, unknown>;
  parentMessageId?: number;
  createdAt: string;
  updatedAt: string;
  blocks: AgentMessageBlock[];
}

export interface AgentThread {
  threadId: number;
  userId: number;
  title?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  messages?: AgentMessage[];
}

// Block DTOs
export const createBlockDtoSchema = z.object({
  type: AgentBlockType,
  order: z.number().int().min(0),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  status: AgentBlockStatus.optional().default('completed'),
  error: z.string().optional(),

  // Tool-specific fields
  toolName: z.string().optional(),
  toolInput: z.record(z.unknown()).optional(),
  toolOutput: z.record(z.unknown()).optional(),

  // Chart-specific fields
  chartType: z.string().optional(),
  chartData: z.record(z.unknown()).optional(),
});

export const updateBlockDtoSchema = createBlockDtoSchema
  .partial()
  .omit({ order: true });

export type CreateBlockDto = z.infer<typeof createBlockDtoSchema>;
export type UpdateBlockDto = z.infer<typeof updateBlockDtoSchema>;

// Thread DTOs
export const createThreadDtoSchema = z.object({
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateThreadDtoSchema = z.object({
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateThreadDto = z.infer<typeof createThreadDtoSchema>;
export type UpdateThreadDto = z.infer<typeof updateThreadDtoSchema>;

// Message DTOs
export const createMessageDtoSchema = z.object({
  threadId: z.number(),
  role: AgentMessageRole.optional().default('USER'),
  metadata: z.record(z.unknown()).optional(),
  blocks: z.array(createBlockDtoSchema).optional(),
});

export const sendMessageDtoSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateMessageDto = z.infer<typeof createMessageDtoSchema>;
export type SendMessageDto = z.infer<typeof sendMessageDtoSchema>;
