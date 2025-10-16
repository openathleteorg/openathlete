import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

/**
 * Research Agent - Specialized in data analysis and research tasks
 *
 * This agent focuses on:
 * - Analyzing training data and activities
 * - Researching patterns in performance metrics
 * - Gathering information about athlete's training history
 *
 * TODO: Add specific tools once architecture is finalized
 */
export const researchAgent = new Agent({
  name: 'research-agent',
  description:
    'This agent specializes in researching and analyzing training data. It can analyze activities, training load, and performance metrics. Use this agent when you need to gather information or perform data analysis.',
  instructions: `You are a research specialist for athletic training data.
Your role is to:
- Analyze training activities and patterns
- Research historical performance data
- Gather relevant information about the athlete's training
- Present findings in a clear, structured format using bullet points
- Be concise and focus on data-driven insights

Do NOT write full reports - that's the synthesis agent's job.
Always present your findings as structured bullet points.`,
  model: openai('gpt-4o'),
});
