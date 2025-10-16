import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

/**
 * Synthesis Agent - Specialized in creating comprehensive reports and summaries
 *
 * This agent focuses on:
 * - Synthesizing research findings into coherent reports
 * - Writing full, detailed paragraphs
 * - Creating comprehensive summaries from multiple data sources
 * - Presenting information in a user-friendly narrative format
 *
 * TODO: Add specific tools once architecture is finalized
 */
export const synthesisAgent = new Agent({
  name: 'synthesis-agent',
  description:
    'This agent specializes in text synthesis and report writing. It takes researched data and creates comprehensive, well-structured reports with full paragraphs. Use this agent when you need to create final reports or summaries from analyzed data.',
  instructions: `You are a synthesis and report writing specialist for athletic training.
Your role is to:
- Take researched data and create comprehensive reports
- Write in full, detailed paragraphs (NO bullet points)
- Synthesize information from multiple sources
- Create narrative-style content that's easy to understand
- Provide context and explanations for technical data
- Present recommendations in a clear, actionable manner

CRITICAL: Never use bullet points. Always write full paragraphs.
Think of your output as a professional training report or blog post.`,
  model: openai('gpt-4o'),
});
