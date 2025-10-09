import { z } from 'zod';

import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '../../misc';

export const createTrainingZoneDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(TRAINING_ZONE_TYPE),
  min: z.number(),
  max: z.number(),
  color: z.string(),
  sports: z.array(z.nativeEnum(SPORT_TYPE)),
  athleteId: z.number(),
});

export const updateTrainingZoneDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(TRAINING_ZONE_TYPE).optional(),
  min: z.number(),
  max: z.number(),
  color: z.string(),
  sports: z.array(z.nativeEnum(SPORT_TYPE)),
});

export type CreateTrainingZoneDto = z.infer<typeof createTrainingZoneDtoSchema>;
export type UpdateTrainingZoneDto = z.infer<typeof updateTrainingZoneDtoSchema>;
