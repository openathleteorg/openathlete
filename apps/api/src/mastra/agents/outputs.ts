import { z } from 'zod';

export { activityAiSummarySchema as activitySummaryOutputSchema } from '@openathlete/shared';

/**
 * Outputs of the agents that return data. The AI service validates answers
 * against them, whatever the provider: no more JSON parsing from free text.
 */

export const feedbackQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        // Null for an open question, not left out: Groq's strict JSON
        // schema refuses a property missing from `required`
        qcmOptions: z.array(z.object({ label: z.string().min(1) })).nullable(),
      }),
    )
    .max(6),
});

export const injuriesOutputSchema = z.object({
  injuries: z.array(
    z.object({
      location: z.string().min(1),
      painScore: z.number(),
      context: z.string(),
      status: z.enum(['WORSENING', 'IMPROVING', 'STABLE', 'RESOLVED']),
    }),
  ),
});

export const rpeOutputSchema = z.object({
  extractedRpe: z.number().min(0).max(1).nullable(),
});

export const trimpEstimationOutputSchema = z.object({
  duration_min: z.number(),
  hr_avg: z.number(),
  delta: z.number(),
  trimp: z.number().nonnegative(),
  assumptions: z.array(z.string()),
  confidence: z.number(),
  explanation: z.string(),
});
