import { z } from 'zod';

import { emailLanguageSchema } from '../../../email/email';
import { newPasswordSchema } from './password';
import { personNameSchema } from './person-name';

export const createAccountDtoSchema = z.object({
  email: z.string().email(),
  password: newPasswordSchema,
  firstName: personNameSchema,
  lastName: personNameSchema,
  invitationToken: z.string().optional(),
  coachInvitationToken: z.string().optional(),
  /** Language the app is shown in, saved on the new account for its emails */
  language: emailLanguageSchema.optional(),
});

export type CreateAccountDto = z.infer<typeof createAccountDtoSchema>;
