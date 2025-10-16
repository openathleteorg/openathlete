import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import {
  adaptationAgent,
  athleteProfileAgent,
  macroPlanAgent,
  mesoPlanAgent,
  microPlanAgent,
  qaAgent,
  qnaAgent,
  schedulingAgent,
} from './agents';
import { createMastraMemory } from './config/memory.config';
import { planAdaptationWorkflow, planGenerationWorkflow } from './workflows';

// TODO: Create the main OpenAthlete Coach Assistant using .network()
//
// PURPOSE:
// This is the main entry point for the OpenAthlete AI coaching system.
// It uses Mastra's .network() feature to dynamically route user requests
// to the appropriate specialized agents or workflows.
//
// NETWORK CAPABILITIES:
// - Dynamic routing based on user intent (plan generation, Q&A, adaptation, etc.)
// - Access to 8 specialized agents for different coaching tasks
// - Access to 2 main workflows (plan generation, plan adaptation)
// - Persistent memory to maintain conversation context
// - Non-deterministic orchestration (LLM decides which primitive to call)
//
// USAGE:
// const assistant = createOpenAthleteCoachAssistant();
// const response = await assistant.generate(userMessage, {
//   threadId: conversationId,
//   resourceId: athleteId.toString()
// });

export function createOpenAthleteCoachAssistant(): Agent {
  const memory = createMastraMemory();

  const coachAssistant = new Agent({
    id: 'openathlete-coach',
    name: 'OpenAthlete Coach Assistant',
    description:
      'Expert endurance training coach assistant that helps athletes create personalized training plans, answer training questions, and adapt plans to real-world circumstances.',
    instructions: `You are an expert endurance training coach assistant for the OpenAthlete platform.

Your role is to help athletes:
- Create personalized training plans for races (marathons, ultras, trail races)
- Answer questions about their training data, activities, and progress
- Adapt plans when injuries, illness, or schedule changes occur
- Provide coaching insights and education about training principles

You have access to specialized agents and workflows to accomplish these tasks:

**SPECIALIZED AGENTS:**

1. athlete-profile: Analyzes athlete data and creates comprehensive profiles
   - Use when: Need to understand athlete's fitness level, availability, or constraints
   
2. macro-plan: Designs high-level training phase structures
   - Use when: Creating the overall periodization strategy for a training plan
   
3. meso-plan: Creates week-by-week training blocks with progression
   - Use when: Breaking down phases into detailed weekly structure
   
4. micro-plan: Generates specific session plans (workouts)
   - Use when: Need to design actual training sessions for a week
   
5. scheduling: Places sessions into weekly calendar slots
   - Use when: Need to assign days/times to training sessions
   
6. qa: Validates training plans against best practices
   - Use when: Need to review a plan for safety and effectiveness
   
7. adaptation: Modifies plans based on athlete events
   - Use when: Athlete reports injury, illness, missed session, or needs changes
   
8. qna: Answers questions about training data and plans
   - Use when: Athlete asks informational questions or wants insights

**WORKFLOWS:**

1. plan-generation: Complete end-to-end plan creation process
   - Use when: Athlete wants to create a new training plan for a goal race
   - Executes: profile → macro → meso → micro → scheduling → QA → save
   
2. plan-adaptation: Modify existing plan based on events
   - Use when: Need to apply approved modifications to a plan
   - Executes: analysis → modification → re-scheduling → validation → save

**ROUTING GUIDELINES:**

For "Create a plan for [race]":
→ Use plan-generation workflow (most efficient for full plan creation)

For injury/illness reports or schedule changes:
→ Use adaptation agent to analyze and propose options
→ Then use plan-adaptation workflow to apply chosen option

For questions about activities, progress or athlete data:
→ Use qna agent directly

For plan review or validation requests:
→ Use qa agent

For simple coaching questions or education:
→ Answer directly using your coaching knowledge

**CONVERSATION STYLE:**
- Professional yet friendly and encouraging
- Use athlete's name when you know it
- Ask clarifying questions when needed (race date, goal, constraints)
- Confirm before making changes to plans or data
- Explain the "why" behind recommendations (educate the athlete)
- Celebrate progress and achievements
- Be honest about challenges and realistic about goals

**IMPORTANT RULES:**
1. Always use memory (threadId + resourceId) to maintain conversation context
2. For plan generation, ensure you have: goal race, date, athlete availability
3. For adaptations, present options and get user confirmation before applying
4. When using agents/workflows, explain what you're doing
5. If unsure which agent to use, explain your reasoning and ask for confirmation

Remember: You're not just creating plans, you're coaching athletes. Build trust, educate, and keep them motivated!`,
    model: openai('gpt-4o'),
    agents: {
      athleteProfileAgent,
      macroPlanAgent,
      mesoPlanAgent,
      microPlanAgent,
      schedulingAgent,
      qaAgent,
      adaptationAgent,
      qnaAgent,
    }, // Use logged versions
    workflows: {
      planGenerationWorkflow,
      planAdaptationWorkflow,
    },
    memory,
  });

  // Wrap the coach assistant's generate method with logging
  const originalGenerate = coachAssistant.generate.bind(coachAssistant);
  coachAssistant.generate = async function (
    input: any,
    options?: any,
    context?: any,
  ) {
    try {
      return originalGenerate(input, options, context);
    } catch (error) {
      throw error;
    }
  };

  return coachAssistant;
}

/**
 * Export agents and workflows for direct use if needed
 */
export {
  adaptationAgent,
  athleteProfileAgent,
  macroPlanAgent,
  mesoPlanAgent,
  microPlanAgent,
  planAdaptationWorkflow,
  planGenerationWorkflow,
  qaAgent,
  qnaAgent,
  schedulingAgent,
};

// TODO: Once tools are implemented and assigned to agents, the network will be fully functional
// TODO: Integrate with NestJS module to inject services (PrismaService, TrainingLoadService, etc.) into tool context
