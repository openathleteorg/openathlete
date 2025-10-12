import { z } from 'zod';

import { METRIC_TYPE } from '../../misc';

export const createMetricDtoSchema = z.object({
  type: z.nativeEnum(METRIC_TYPE),
  date: z.coerce.date(),
  value: z.coerce.number().positive('Value must be positive'),
  notes: z.string().optional(),
});

export const updateMetricDtoSchema = z.object({
  value: z.number().optional(),
  notes: z.string().optional(),
});

export type CreateMetricDto = z.infer<typeof createMetricDtoSchema>;
export type UpdateMetricDto = z.infer<typeof updateMetricDtoSchema>;
