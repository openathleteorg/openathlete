import { z } from 'zod';

import { emailLanguageSchema } from '../../../email/email';
import { unitSystemSchema } from '../core/unit-system.dto';

export const firebaseLoginDtoSchema = z.object({
  idToken: z.string().min(1),
  invitationToken: z.string().optional(),
  coachInvitationToken: z.string().optional(),
  /** Only used when this sign-in creates the account */
  language: emailLanguageSchema.optional(),
  /** Only used when this sign-in creates the account */
  unitSystem: unitSystemSchema.optional(),
});

export type FirebaseLoginDto = z.infer<typeof firebaseLoginDtoSchema>;
