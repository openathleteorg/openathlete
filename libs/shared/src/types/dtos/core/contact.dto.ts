import { z } from 'zod';

export const contactSubmissionSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  goal: z.string().optional().nullable(),
  message: z.string().min(1),
});

export type ContactSubmissionDto = z.infer<typeof contactSubmissionSchema>;
