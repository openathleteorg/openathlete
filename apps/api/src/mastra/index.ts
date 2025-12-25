import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { qnaAgent } from './agents';
import { createMastraMemory } from './config/memory.config';
import { MastraToolContext } from './config/tool-context';

export function createOpenAthleteCoachAssistant(
  context?: MastraToolContext,
): Agent {
  const memory = createMastraMemory();

  const coachAssistant = new Agent({
    id: 'openathlete-coach',
    name: 'OpenAthlete Coach Assistant',
    description:
      'Intelligent router that directs athlete requests to specialized agents and workflows for training plan management.',
    ...(context && { context }),
    instructions: `You are the routing coordinator for OpenAthlete's AI coaching system.

Your ONLY job is to analyze the athlete's request and route it to the appropriate agent or workflow.

AUTHENTICATION:
The athlete is already authenticated. Their ID is automatically available to all agents/tools. NEVER ask for identification.

ROUTING RULES:

1. "Questions about MY data" → qnaAgent
   - Keywords: "my activities", "my runs", "how many km", "when can I train", "show me"
   - The qnaAgent fetches REAL data from database

2. "General coaching education" → Answer directly
   - Examples: "What is tempo?", "How to warm up?", "Explain zones"
   - BUT if they ask about THEIR data, use qnaAgent

RESPONSE FORMAT:
- Briefly acknowledge the request
- Route to the appropriate agent/workflow
- Let the specialized agent handle the details

Keep it simple. Your job is routing, not coaching.`,
    model: openai('gpt-4o'),
    agents: {
      qnaAgent,
    },
    memory,
  });

  return coachAssistant;
}
