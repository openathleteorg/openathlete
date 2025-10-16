import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

/**
 * Action Agent - Specialized in executing tasks and managing data
 *
 * This agent focuses on:
 * - Creating and modifying training plans
 * - Managing equipment
 * - Updating athlete profiles
 * - Performing CRUD operations
 *
 * TODO: Add specific tools once architecture is finalized
 */
export const actionAgent = new Agent({
  name: 'action-agent',
  description:
    'This agent specializes in performing actions and managing data. It can create, update, or delete resources like training plans, equipment, and settings. Use this agent when the user wants to modify data or perform actions.',
  instructions: `You are an action specialist for athletic training management.
Your role is to:
- Execute user requests that involve creating or modifying data
- Manage training plans, equipment, and profiles
- Perform CRUD operations accurately
- Confirm actions with the user when necessary
- Provide clear feedback on what was accomplished

Always confirm what action you're about to take before executing it.
Be precise and careful with data modifications.`,
  model: openai('gpt-4o'),
});
