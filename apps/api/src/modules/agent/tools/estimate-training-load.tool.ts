import { createTool } from '@mastra/core';
import { z } from 'zod';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type EstimateTrainingLoadInput = {
  workoutDescription: string;
  estimatedRpe?: number;
  estimatedDuration?: number;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the estimate training load tool
 * Uses Foster's method: Training Load = RPE × Duration (in minutes)
 */
export function estimateTrainingLoadToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'estimate-training-load',
    description: `Estimates the training load for a workout session using Foster's method (RPE × Duration).
This tool helps determine if a planned or suggested workout will fit within the user's weekly training capacity.

Use this tool when:
- Planning a new workout session
- User asks if they can fit a certain workout in their week
- Evaluating the intensity of a suggested training session
- Comparing different workout options

The tool takes a textual description of the workout (e.g., "45-minute easy run", "2x10x30/30 intervals at 90% VO2max", "1-hour tempo run at threshold pace") and estimates:
1. RPE (Rate of Perceived Exertion, 0-10 scale) - how hard the workout feels
2. Duration (in minutes) - total workout time including warm-up, main set, and cool-down
3. Training Load = RPE × Duration (Foster's method)

Important notes:
- Intensity should be relative to the individual (e.g., "90% VO2max" or "threshold pace" rather than specific speeds)
- RPE scale: 0 = rest, 1-2 = very light, 3-4 = moderate, 5-6 = hard, 7-8 = very hard, 9-10 = maximal
- Examples:
  * Easy run 45min → RPE ~3, Load = 135
  * Tempo run 1h → RPE ~7, Load = 420
  * Intervals 30/30 × 10, 1h total → RPE ~8, Load = 480
  * Long slow run 2h → RPE ~4, Load = 480

You can provide your own estimates for RPE and duration, or let the system estimate them from the description.`,
    inputSchema: z.object({
      workoutDescription: z
        .string()
        .describe(
          'Textual description of the workout session. Be specific about intensity (e.g., "easy pace", "threshold", "90% VO2max") and structure (e.g., "45min", "2x10x30/30"). Include warm-up and cool-down if relevant.',
        ),
      estimatedRpe: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe(
          'Optional: Your estimate of RPE (Rate of Perceived Exertion, 0-10 scale). If not provided, will be estimated from the description.',
        ),
      estimatedDuration: z
        .number()
        .positive()
        .optional()
        .describe(
          'Optional: Your estimate of total duration in minutes. If not provided, will be estimated from the description.',
        ),
    }),
    outputSchema: z.object({
      workout_description: z.string(),
      estimated_rpe: z.number(),
      estimated_duration_minutes: z.number(),
      training_load: z.number(),
      training_load_category: z.enum(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']),
      explanation: z.string(),
      success: z.boolean(),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as EstimateTrainingLoadInput;
      const { workoutDescription, estimatedRpe, estimatedDuration } = params;

      try {
        // If RPE and duration are not provided, estimate them from the description
        // This is a simplified heuristic-based estimation
        let finalRpe = estimatedRpe;
        let finalDuration = estimatedDuration;

        if (!finalRpe || !finalDuration) {
          const estimation = estimateFromDescription(workoutDescription);
          finalRpe = finalRpe ?? estimation.rpe;
          finalDuration = finalDuration ?? estimation.duration;
        }

        // Calculate training load using Foster's method
        const trainingLoad = Math.round(finalRpe * finalDuration);

        // Categorize training load
        let category: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
        if (trainingLoad < 200) {
          category = 'LOW';
        } else if (trainingLoad < 400) {
          category = 'MODERATE';
        } else if (trainingLoad < 600) {
          category = 'HIGH';
        } else {
          category = 'VERY_HIGH';
        }

        // Generate explanation
        const explanation = generateExplanation(
          workoutDescription,
          finalRpe,
          finalDuration,
          trainingLoad,
          category,
        );

        return {
          workout_description: workoutDescription,
          estimated_rpe: finalRpe,
          estimated_duration_minutes: finalDuration,
          training_load: trainingLoad,
          training_load_category: category,
          explanation,
          success: true,
        };
      } catch (error) {
        console.error('[estimateTrainingLoad] Error:', error);
        throw new Error(
          `Failed to estimate training load: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}

/**
 * Estimates RPE and duration from workout description
 * This is a heuristic-based approach with pattern matching
 */
function estimateFromDescription(description: string): {
  rpe: number;
  duration: number;
} {
  const lowerDesc = description.toLowerCase();

  // Extract duration if explicitly mentioned
  let duration = 60; // default 60 minutes
  const durationPatterns = [
    /(\d+)\s*(h|hour|hours)/i,
    /(\d+)\s*(min|minute|minutes)/i,
    /(\d+)h(\d+)/i, // e.g., "1h30"
  ];

  for (const pattern of durationPatterns) {
    const match = description.match(pattern);
    if (match) {
      if (pattern.toString().includes('min')) {
        duration = parseInt(match[1], 10);
      } else if (pattern.toString().includes('h\\d+')) {
        // e.g., "1h30"
        duration = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      } else {
        duration = parseInt(match[1], 10) * 60;
      }
      break;
    }
  }

  // Estimate RPE based on keywords
  let rpe = 5; // default moderate

  // Very easy / recovery
  if (/easy|recovery|light|gentle|jogging|footing facile/i.test(lowerDesc)) {
    rpe = 3;
  }
  // Moderate / steady
  else if (/moderate|steady|base|endurance|aérobie|aerobic/i.test(lowerDesc)) {
    rpe = 4;
  }
  // Tempo / threshold
  else if (
    /tempo|threshold|seuil|sustained|comfortably hard/i.test(lowerDesc)
  ) {
    rpe = 7;
  }
  // Intervals / VO2max
  else if (
    /interval|vo2|vma|fractionn|30\/30|30x30|répétition|repetition|speed/i.test(
      lowerDesc,
    )
  ) {
    rpe = 8;
  }
  // Very hard / race effort
  else if (
    /hard|race|competition|max|maximum|all.?out|sprint/i.test(lowerDesc)
  ) {
    rpe = 9;
  }
  // Long run (adjust RPE based on duration)
  else if (/long|longue|endurance/i.test(lowerDesc)) {
    rpe = duration > 90 ? 5 : 4;
  }

  // Adjust duration for intervals (often shorter main sets)
  if (/30\/30|30x30/i.test(lowerDesc)) {
    // 30/30 sessions are typically 10-15 reps = 10 minutes main set + warm-up/cool-down
    const reps = description.match(/(\d+)\s*x\s*30/i);
    if (reps) {
      const mainSet = parseInt(reps[1], 10); // number of reps in minutes
      duration = mainSet + 20; // add 20min for warm-up/cool-down
    } else {
      duration = 45; // default for interval session
    }
  } else if (/2\s*x\s*10/i.test(lowerDesc)) {
    // 2x10 minutes intervals
    duration = 60; // 20min main + 40min warm-up/cool-down/rest
  }

  return { rpe, duration };
}

/**
 * Generates a human-readable explanation of the training load estimation
 */
function generateExplanation(
  description: string,
  rpe: number,
  duration: number,
  trainingLoad: number,
  category: string,
): string {
  const rpeDescriptions: Record<number, string> = {
    0: 'rest',
    1: 'very light',
    2: 'very light',
    3: 'light/easy',
    4: 'moderate',
    5: 'moderate to hard',
    6: 'hard',
    7: 'very hard',
    8: 'very hard',
    9: 'near maximal',
    10: 'maximal effort',
  };

  const rpeDesc = rpeDescriptions[Math.round(rpe)] || 'moderate';

  let explanation = `Based on the workout "${description}", `;
  explanation += `the estimated effort is ${rpe}/10 (${rpeDesc}) `;
  explanation += `for a duration of ${duration} minutes. `;
  explanation += `\n\nUsing Foster's method (RPE × Duration), the training load is ${trainingLoad}. `;
  explanation += `This is considered a ${category.toLowerCase().replace('_', ' ')} training load.`;

  // Add context based on category
  if (category === 'LOW') {
    explanation += ` This session should be easy to recover from and can fit into most training weeks.`;
  } else if (category === 'MODERATE') {
    explanation += ` This is a standard training session that requires adequate recovery.`;
  } else if (category === 'HIGH') {
    explanation += ` This is a demanding session that requires good recovery and should be balanced with easier days.`;
  } else {
    explanation += ` This is a very demanding session that requires significant recovery time and careful planning within the training week.`;
  }

  return explanation;
}
