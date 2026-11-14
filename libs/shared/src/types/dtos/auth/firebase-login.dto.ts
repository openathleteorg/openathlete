import { z } from 'zod';

import { emailLanguageSchema } from '../../../email/email';

export const firebaseLoginDtoSchema = z.object({
  idToken: z.string().min(1),
  invitationToken: z.string().optional(),
  coachInvitationToken: z.string().optional(),
  /** A club's link or invitation, opening sign-up on an invite-only instance */
  clubJoinToken: z.string().max(200).optional(),
  /** Only used when this sign-in creates the account */
  language: emailLanguageSchema.optional(),
});

export type FirebaseLoginDto = z.infer<typeof firebaseLoginDtoSchema>;
