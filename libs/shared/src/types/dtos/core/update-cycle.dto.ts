import { z } from 'zod';

import { CYCLE_KIND } from '../../misc';

export const updateCycleDtoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  kind: z.nativeEnum(CYCLE_KIND).optional(),
});

export type UpdateCycleDto = z.infer<typeof updateCycleDtoSchema>;
