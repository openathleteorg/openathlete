/**
 * Mastra Execution Logger
 *
 * Provides logging utilities to trace agent, workflow, and tool executions
 * for debugging and monitoring purposes.
 */

export class MastraLogger {
  private static indent = 0;
  private static executionStack: string[] = [];

  /**
   * Log when an agent is called
   */
  static logAgentCall(agentName: string, input?: any) {
    const prefix = '  '.repeat(this.indent);
    console.log(`\n${prefix}🤖 [AGENT CALL] ${agentName}`);
    if (input) {
      console.log(`${prefix}   Input:`, JSON.stringify(input, null, 2));
    }
    this.executionStack.push(`Agent: ${agentName}`);
    this.indent++;
  }

  /**
   * Log when an agent completes
   */
  static logAgentComplete(agentName: string, output?: any) {
    this.indent = Math.max(0, this.indent - 1);
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}✅ [AGENT COMPLETE] ${agentName}`);
    if (output) {
      const outputStr =
        typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      const truncated =
        outputStr.length > 200
          ? outputStr.substring(0, 200) + '...'
          : outputStr;
      console.log(`${prefix}   Output: ${truncated}`);
    }
    this.executionStack.pop();
  }

  /**
   * Log when an agent fails
   */
  static logAgentError(agentName: string, error: any) {
    this.indent = Math.max(0, this.indent - 1);
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}❌ [AGENT ERROR] ${agentName}`);
    console.log(`${prefix}   Error:`, error.message || error);
    this.executionStack.pop();
  }

  /**
   * Log when a workflow is called
   */
  static logWorkflowCall(workflowName: string, input?: any) {
    const prefix = '  '.repeat(this.indent);
    console.log(`\n${prefix}⚙️  [WORKFLOW CALL] ${workflowName}`);
    if (input) {
      console.log(`${prefix}   Input:`, JSON.stringify(input, null, 2));
    }
    this.executionStack.push(`Workflow: ${workflowName}`);
    this.indent++;
  }

  /**
   * Log when a workflow completes
   */
  static logWorkflowComplete(workflowName: string, output?: any) {
    this.indent = Math.max(0, this.indent - 1);
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}✅ [WORKFLOW COMPLETE] ${workflowName}`);
    if (output) {
      const outputStr =
        typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      const truncated =
        outputStr.length > 200
          ? outputStr.substring(0, 200) + '...'
          : outputStr;
      console.log(`${prefix}   Output: ${truncated}`);
    }
    this.executionStack.pop();
  }

  /**
   * Log when a workflow fails
   */
  static logWorkflowError(workflowName: string, error: any) {
    this.indent = Math.max(0, this.indent - 1);
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}❌ [WORKFLOW ERROR] ${workflowName}`);
    console.log(`${prefix}   Error:`, error.message || error);
    this.executionStack.pop();
  }

  /**
   * Log when a tool is called
   */
  static logToolCall(toolName: string, input?: any) {
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}🔧 [TOOL CALL] ${toolName}`);
    if (input) {
      console.log(`${prefix}   Input:`, JSON.stringify(input, null, 2));
    }
    this.executionStack.push(`Tool: ${toolName}`);
    this.indent++;
  }

  /**
   * Log when a tool completes
   */
  static logToolComplete(toolName: string, output?: any) {
    this.indent = Math.max(0, this.indent - 1);
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}✅ [TOOL COMPLETE] ${toolName}`);
    if (output) {
      const outputStr =
        typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      const truncated =
        outputStr.length > 200
          ? outputStr.substring(0, 200) + '...'
          : outputStr;
      console.log(`${prefix}   Output: ${truncated}`);
    }
    this.executionStack.pop();
  }

  /**
   * Log when a tool fails
   */
  static logToolError(toolName: string, error: any) {
    this.indent = Math.max(0, this.indent - 1);
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}❌ [TOOL ERROR] ${toolName}`);
    console.log(`${prefix}   Error:`, error.message || error);
    this.executionStack.pop();
  }

  /**
   * Log the current execution stack
   */
  static logStack() {
    console.log('\n📊 [EXECUTION STACK]');
    if (this.executionStack.length === 0) {
      console.log('   (empty)');
    } else {
      this.executionStack.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item}`);
      });
    }
  }

  /**
   * Reset the logger state
   */
  static reset() {
    this.indent = 0;
    this.executionStack = [];
  }

  /**
   * Log a network routing decision
   */
  static logNetworkRouting(from: string, to: string, reason?: string) {
    const prefix = '  '.repeat(this.indent);
    console.log(`\n${prefix}🔀 [NETWORK ROUTING] ${from} → ${to}`);
    if (reason) {
      console.log(`${prefix}   Reason: ${reason}`);
    }
  }

  /**
   * Log a general message
   */
  static log(message: string, data?: any) {
    const prefix = '  '.repeat(this.indent);
    console.log(`${prefix}ℹ️  ${message}`);
    if (data) {
      console.log(`${prefix}   Data:`, JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Wrapper function to log tool execution
 */
export function withToolLogging<TInput, TOutput>(
  toolName: string,
  executeFn: (input: TInput) => Promise<TOutput>,
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput) => {
    MastraLogger.logToolCall(toolName, input);
    try {
      const result = await executeFn(input);
      MastraLogger.logToolComplete(toolName, result);
      return result;
    } catch (error) {
      MastraLogger.logToolError(toolName, error);
      throw error;
    }
  };
}
