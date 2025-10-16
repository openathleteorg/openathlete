import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { Memory } from '@mastra/memory';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { actionAgent, researchAgent, synthesisAgent } from './agents';
import { createMastraMemory } from './config/memory.config';
import {
  reportGenerationWorkflow,
  trainingAnalysisWorkflow,
} from './workflows';

export function createOpenAthleteNetworkAgent(): Agent {
  const memory = createMastraMemory();

  const routingAgent = new Agent({
    id: 'openathlete-network',
    name: 'OpenAthlete Assistant',
    instructions: `You are the OpenAthlete AI Assistant, a sophisticated multi-agent system designed to help athletes manage and optimize their training.

Your capabilities include:
- Analyzing training data and performance metrics
- Creating comprehensive training reports
- Managing training plans and equipment
- Answering questions about athletic training
- Providing personalized recommendations

You have access to specialized agents and workflows:

**Agents:**
1. Research Agent: Use for data analysis, pattern recognition, and information gathering
2. Synthesis Agent: Use for creating detailed reports and summaries with full paragraphs
3. Action Agent: Use for creating, updating, or deleting data (training plans, equipment, etc.)

**Workflows:**
1. Training Analysis Workflow: Complete analysis of training data over a period
2. Report Generation Workflow: Generate comprehensive reports from analyzed data

**When to use what:**
- For simple questions or information requests: Answer directly
- For data analysis or research: Use the Research Agent or Training Analysis Workflow
- For creating final reports: Use the Synthesis Agent or Report Generation Workflow  
- For modifying data: Use the Action Agent
- For complex multi-step tasks: Combine multiple agents/workflows as needed

**Important rules:**
- Always confirm before performing destructive actions
- Use the most specific tool/agent for the task
- Provide clear, actionable responses
- Be concise but thorough

TODO: Once tools are implemented, this agent will have access to all training data and capabilities.`,
    model: openai('gpt-4o'),
    agents: {
      researchAgent,
      synthesisAgent,
      actionAgent,
    },
    workflows: {
      trainingAnalysisWorkflow,
      reportGenerationWorkflow,
    },
    memory,
  });

  return routingAgent;
}

/**
 * Export for convenience
 */
export { researchAgent, synthesisAgent, actionAgent };
export { trainingAnalysisWorkflow, reportGenerationWorkflow };
