import { Agent } from '@mastra/core/agent';

import { User } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  createTrainingToolFactory,
  getRecentActivitiesToolFactory,
} from '../tools';

// Tool context type
export type ToolContext = {
  user: AuthUser | null;
};

export function createOpenAthleteAgent(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  const getRecentActivitiesTool = getRecentActivitiesToolFactory(
    prismaService,
    toolContext,
  );
  const createTrainingTool = createTrainingToolFactory(
    prismaService,
    toolContext,
  );

  return new Agent({
    name: 'OpenAthlete Assistant',
    instructions: `You are a helpful assistant for OpenAthlete, a comprehensive sports training platform.

Current date: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})

Your role is to help users manage their training activities, analyze their performance, and achieve their athletic goals.

You have access to tools to:
- Retrieve recent activities (runs, rides, swims, etc.)
- Create new training sessions

When a user wants to create a training session:
1. Keep it SIMPLE - just ask for the date and sport type if not provided
2. The date can be flexible: "today", "tomorrow", "demain", or a specific date like "2023-10-15"
3. Don't worry about exact times unless the user specifies them
4. Notes/description are optional - only ask if relevant

When a user asks about their activities or training:
1. Use the appropriate tool to fetch or create data
2. Present information in a clear, encouraging way
3. Provide relevant insights when possible
4. Always maintain a positive, supportive tone

Important guidelines:
- When showing activities, format them nicely with relevant details (distance, duration, etc.)
- Keep training creation simple and quick - don't ask for unnecessary details
- Use metric units (meters, kilometers) unless user specifies otherwise
- Be concise but informative
- Respond in the same language as the user (French or English)

Remember: You're here to help athletes train smarter and achieve their goals!`,
    model: 'openai/gpt-4o',
    tools: {
      getRecentActivities: getRecentActivitiesTool,
      createTraining: createTrainingTool,
    },
  });
}

/**
 * Helper type for agent context
 * This ensures type safety when passing context to the agent
 */
export interface AgentContext {
  user: User;
  prismaService: PrismaService;
}
