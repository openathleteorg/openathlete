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
  /** A club's link or invitation, opening sign-up on an invite-only instance */
  clubJoinToken: z.string().max(200).optional(),
  /** Language the app is shown in, saved on the new account for its emails */
  language: emailLanguageSchema.optional(),
  /** Asked for news about the project, Supporter included (unticked by default) */
  emailNews: z.boolean().optional(),
});

export type CreateAccountDto = z.infer<typeof createAccountDtoSchema>;
