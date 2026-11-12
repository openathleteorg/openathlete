import { z } from 'zod';

import { WORKOUT_DURATION_TYPE } from '../../misc';

/** A strength exercise a coach or athlete adds to the catalog */
export const createCustomExerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  instructions: z.string().max(4000).default(''),
  /** A video or image the athlete can open: http(s) only */
  mediaUrl: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((url) => /^https?:\/\//i.test(url), 'http(s) links only')
    .nullable()
    .optional(),
  bodyPart: z.string().max(40).nullable().optional(),
  equipment: z.string().max(40).nullable().optional(),
  defaultDurationType: z
    .enum([WORKOUT_DURATION_TYPE.REPS, WORKOUT_DURATION_TYPE.TIME])
    .default(WORKOUT_DURATION_TYPE.REPS),
  defaultDurationValue: z.number().min(1).max(3600).nullable().optional(),
});

export type CreateCustomExerciseDto = z.infer<
  typeof createCustomExerciseSchema
>;

export const updateCustomExerciseSchema = createCustomExerciseSchema.partial();

export type UpdateCustomExerciseDto = z.infer<
  typeof updateCustomExerciseSchema
>;

export interface CustomExerciseDto {
  customExerciseId: number;
  /** As workout steps reference it */
  ref: string;
  name: string;
  instructions: string;
  mediaUrl: string | null;
  bodyPart: string | null;
  equipment: string | null;
  defaultDurationType: WORKOUT_DURATION_TYPE;
  defaultDurationValue: number | null;
  /** Whether the reader may change it */
  mine: boolean;
}
