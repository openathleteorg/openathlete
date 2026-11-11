import { z } from 'zod';

export const ACQUISITION_SOURCES = [
  'REDDIT',
  'GOOGLE',
  'AI_ASSISTANT',
  'COACH_OR_FRIEND',
  'DISCORD',
  'YOUTUBE',
  'OTHER',
] as const;

export const acquisitionSourceSchema = z.enum(ACQUISITION_SOURCES);

export type AcquisitionSource = z.infer<typeof acquisitionSourceSchema>;

export const completeOnboardingDtoSchema = z.object({
  roles: z.array(z.enum(['ATHLETE', 'COACH'])).min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  hrMax: z.number().int().positive().optional(),
  hrRest: z.number().int().positive().optional(),
  coachEmail: z.string().email().optional(),
  athleteEmails: z.array(z.string().email()).optional(),
  acquisitionSource: acquisitionSourceSchema.optional(),
});

export type CompleteOnboardingDto = z.infer<typeof completeOnboardingDtoSchema>;
