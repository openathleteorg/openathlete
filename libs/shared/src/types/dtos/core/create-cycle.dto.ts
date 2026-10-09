import { z } from 'zod';

import { CYCLE_KIND } from '../../misc';

export const createCycleDtoSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().default(''),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  kind: z.nativeEnum(CYCLE_KIND).optional(),
  athleteId: z.number().optional().nullable(),
});

export type CreateCycleDto = z.infer<typeof createCycleDtoSchema>;
