import { z } from 'zod';

export const createAccountDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  invitationToken: z.string().optional(),
});

export type CreateAccountDto = z.infer<typeof createAccountDtoSchema>;
