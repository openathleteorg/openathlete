import { Agent } from '@mastra/core/agent';

import { MastraLogger } from '../config/logger';

/**
 * Create a logged version of an agent that traces all executions
 *
 * This wrapper logs:
 * - When the agent is called (with input)
 * - When the agent completes (with output)
 * - When the agent fails (with error)
 *
 * Usage:
 * ```typescript
 * const loggedAgent = createLoggedAgent(qnaAgent);
 * const response = await loggedAgent.generate(prompt, options);
 * ```
 */
export function createLoggedAgent(agent: Agent): Agent {
  const originalGenerate = agent.generate.bind(agent);

  // Override the generate method with logging
  agent.generate = async function (input: any, options?: any, context?: any) {
    const agentName = agent.name || 'Unknown Agent';

    MastraLogger.logAgentCall(agentName, { input, options });

    try {
      const result = await originalGenerate(input, options, context);

      MastraLogger.logAgentComplete(agentName, result?.text || result);

      return result;
    } catch (error) {
      MastraLogger.logAgentError(agentName, error);
      throw error;
    }
  };

  return agent;
}

/**
 * Create logged versions of all agents in a collection
 *
 * Usage:
 * ```typescript
 * const loggedAgents = createLoggedAgents({
 *   qna: qnaAgent,
 *   adaptation: adaptationAgent,
 *   // ...
 * });
 * ```
 */
export function createLoggedAgents<T extends Record<string, Agent>>(
  agents: T,
): T {
  const loggedAgents = {} as T;

  for (const [key, agent] of Object.entries(agents)) {
    loggedAgents[key as keyof T] = createLoggedAgent(agent) as T[keyof T];
  }

  return loggedAgents;
}
