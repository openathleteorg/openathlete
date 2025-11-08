import { z } from 'zod';

export const completeOnboardingDtoSchema = z.object({
  roles: z.array(z.enum(['ATHLETE', 'COACH'])).min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  hrMax: z.number().int().positive().optional(),
  hrRest: z.number().int().positive().optional(),
  coachEmail: z.string().email().optional(),
  athleteEmails: z.array(z.string().email()).optional(),
});

export type CompleteOnboardingDto = z.infer<typeof completeOnboardingDtoSchema>;
