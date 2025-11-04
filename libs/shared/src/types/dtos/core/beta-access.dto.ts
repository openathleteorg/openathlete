import { z } from 'zod';

export const betaAccessRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  type: z.enum(['coach', 'club']),
  athletes: z.string().min(1),
  message: z.string().optional(),
});

export type BetaAccessRequestDto = z.infer<typeof betaAccessRequestSchema>;

