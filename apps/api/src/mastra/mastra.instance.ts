import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

import { createOpenAthleteCoachAssistant } from './index';

/**
 * Mastra Singleton Instance
 *
 * This file creates and exports a single Mastra instance to be used across the application.
 * This is a best practice to avoid recreating agents and memory on every request.
 *
 * Benefits:
 * - Single agent instance (performance + memory efficiency)
 * - Centralized logging configuration
 * - Shared memory across all requests
 * - Proper lifecycle management
 */

// Create Pino logger for Mastra
const logger = new PinoLogger({
  name: 'OpenAthlete-Mastra',
  level:
    (process.env.MASTRA_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') ||
    'info',
});

// Create the OpenAthlete coach assistant agent
const coachAssistant = createOpenAthleteCoachAssistant();

// Create and export Mastra instance
export const mastra = new Mastra({
  agents: {
    'openathlete-coach': coachAssistant,
  },
  logger,
});

// Export coach assistant for direct access if needed
export { coachAssistant };

/**
 * Usage in NestJS services:
 *
 * import { mastra } from '@/mastra/mastra.instance';
 *
 * // Get the agent
 * const agent = mastra.getAgent('openathlete-coach');
 *
 * // Use it
 * const response = await agent.generate(message, {
 *   threadId,
 *   resourceId,
 *   runtimeContext,
 * });
 */
