import { z } from 'zod';

import { INJURY_STATUS } from '../../misc';

export const athleteInjurySchema = z.object({
  athleteInjuryId: z.number(),
  athleteId: z.number(),
  location: z.string(),
  painScore: z.number().min(0).max(1),
  context: z.string(),
  status: z.nativeEnum(INJURY_STATUS),
  sourceActivityId: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AthleteInjury = z.infer<typeof athleteInjurySchema>;
