/**
 * Tool Streaming Types
 *
 * Types for streaming tool execution progress to the frontend
 * Based on Mastra's ChunkType documentation for tool-call and tool-result events
 */

/**
 * Tool execution status
 */
export type ToolExecutionStatus =
  | 'starting' // Tool is being called
  | 'executing' // Tool is executing
  | 'completed' // Tool finished successfully
  | 'error'; // Tool failed with error

/**
 * Agent execution state - tracks which agent is currently processing
 */
export interface AgentExecutionState {
  agentName: string; // Internal agent name (e.g., 'qna', 'macro-plan')
  startTime: number;
  status: 'active' | 'completed';
}

/**
 * Tool call event - emitted when a tool starts executing
 */
export interface ToolCallEvent {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Tool result event - emitted when a tool completes
 */
export interface ToolResultEvent {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result?: unknown;
  isError?: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Agent status event - emitted when agent state changes
 */
export interface AgentStatusEvent {
  type: 'agent-status';
  status: 'thinking' | 'processing' | 'idle';
  message?: string;
  timestamp: number;
}

/**
 * Combined streaming event type
 */
export type StreamingEvent = ToolCallEvent | ToolResultEvent | AgentStatusEvent;

/**
 * Tool execution state for UI tracking
 */
export interface ToolExecutionState {
  toolCallId: string;
  toolName: string;
  status: ToolExecutionStatus;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
}
