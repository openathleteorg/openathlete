import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { qnaAgent } from './agents';

export function createOpenAthleteCoachAssistant(context?: any): Agent {
  // const memory = createMastraMemory();

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

1. "Create/Generate a training plan" → planGenerationWorkflow
   - Keywords: "plan pour", "génère", "create plan", "new training plan"
   - Requires: race name, date, distance (ask if missing)

2. "Modify/Adapt existing plan" → adaptationAgent → planAdaptationWorkflow
   - Keywords: "injury", "sick", "missed session", "change plan", "adjust"
   - Use adaptationAgent first to analyze, then planAdaptationWorkflow to apply

3. "Questions about MY data" → qnaAgent
   - Keywords: "my activities", "my runs", "how many km", "when can I train", "show me"
   - The qnaAgent fetches REAL data from database

4. "Validate/Review a plan" → qaAgent
   - Keywords: "review", "validate", "check plan"

5. "General coaching education" → Answer directly
   - Examples: "What is tempo?", "How to warm up?", "Explain zones"
   - BUT if they ask about THEIR data, use qnaAgent

RESPONSE FORMAT:
- Briefly acknowledge the request
- Route to the appropriate agent/workflow
- Let the specialized agent handle the details

Keep it simple. Your job is routing, not coaching.`,
    model: openai('gpt-4o'),
    agents: {
      // athleteProfileAgent,
      // macroPlanAgent,
      // mesoPlanAgent,
      // microPlanAgent,
      // schedulingAgent,
      // qaAgent,
      // adaptationAgent,
      qnaAgent,
    },
    // workflows: {
    //   planGenerationWorkflow,
    //   planAdaptationWorkflow,
    // },
    // memory,
  });

  return coachAssistant;
}
