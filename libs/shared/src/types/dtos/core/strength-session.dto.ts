import { z } from 'zod';

import { exerciseRefSchema } from './workout.dto';

/** One set as the athlete did it in the session player */
export const strengthLogSetSchema = z.object({
  /** The timeline moment it answers (see sessionTimeline) */
  key: z.string().min(1).max(80),
  exerciseRef: exerciseRefSchema.nullable(),
  name: z.string().max(200),
  reps: z.number().int().min(0).max(1000).nullable(),
  /** Seconds held or worked */
  seconds: z.number().int().min(0).max(36_000).nullable(),
  /** kg */
  load: z.number().min(0).max(1000).nullable(),
  skipped: z.boolean(),
});

export type StrengthLogSet = z.infer<typeof strengthLogSetSchema>;

/** What the player records of a session, kept on the activity */
export const strengthLogSchema = z.object({
  version: z.literal(1),
  sets: z.array(strengthLogSetSchema).max(1000),
  /** AMRAP rounds done, by timeline key */
  amrapRounds: z.record(z.string().max(80), z.number().int().min(0).max(999)),
});

export type StrengthLog = z.infer<typeof strengthLogSchema>;

/** A planned session played to the end: it becomes its activity */
export const completeStrengthSessionSchema = z.object({
  startedAt: z.coerce.date(),
  /** Seconds from start to finish, pauses left out */
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(48 * 3600),
  /** 1 to 10, as the athlete felt it */
  rpe: z.number().min(1).max(10).nullable(),
  comment: z.string().max(4000).optional(),
  log: strengthLogSchema,
});

export type CompleteStrengthSessionDto = z.infer<
  typeof completeStrengthSessionSchema
>;
