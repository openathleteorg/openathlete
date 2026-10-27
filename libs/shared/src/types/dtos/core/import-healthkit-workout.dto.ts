import { z } from 'zod';

import { SPORT_TYPE } from '../../misc';

const instant = z.string().datetime({ offset: true });
const nonnegative = z.number().finite().nonnegative();
const quantity = <T extends string>(unit: T) =>
  z.object({ value: nonnegative, unit: z.literal(unit) }).strict();
const sample = z.object({ timestamp: instant, value: nonnegative }).strict();
const channel = <T extends string>(unit: T) =>
  z
    .object({
      unit: z.literal(unit),
      samples: z.array(sample).min(1).max(100000),
    })
    .strict();

/** One original recording per request. Missing channels are never zero samples. */
export const importHealthkitWorkoutDtoSchema = z
  .object({
    protocolVersion: z.literal(1),
    workoutUuid: z
      .string()
      .uuid()
      .transform((value) => value.toLowerCase()),
    revision: z.number().int().positive().max(2147483647),
    name: z.string().trim().min(1).max(250),
    sport: z
      .nativeEnum(SPORT_TYPE)
      .refine(
        (sport) =>
          ![
            SPORT_TYPE.TRIATHLON,
            SPORT_TYPE.DUATHLON,
            SPORT_TYPE.AQUATHLON,
            SPORT_TYPE.AQUABIKE,
          ].includes(sport),
        'Submit single-sport recordings; multisport parents are unsupported',
      ),
    startDate: instant,
    endDate: instant,
    elapsedDuration: quantity('s'),
    activeDuration: quantity('s').optional(),
    distance: quantity('m').optional(),
    energy: quantity('kJ').optional(),
    elevationGain: quantity('m').optional(),
    description: z.string().max(5000).optional(),
    source: z
      .object({
        bundleIdentifier: z.string().min(1).max(250),
        name: z.string().min(1).max(250),
        version: z.string().max(100).optional(),
        deviceType: z.string().max(100).optional(),
        recordingKind: z.enum(['single', 'multisport_leg']).default('single'),
        parentWorkoutUuid: z.string().uuid().optional(),
        original: z.boolean(),
        indoor: z.boolean().optional(),
      })
      .strict(),
    streams: z
      .object({
        heartrate: channel('bpm').optional(),
        watts: channel('W').optional(),
        cadence: channel('rpm').optional(),
        distance: channel('m').optional(),
        altitude: z
          .object({
            unit: z.literal('m'),
            samples: z
              .array(
                z
                  .object({
                    timestamp: instant,
                    value: z.number().finite(),
                  })
                  .strict(),
              )
              .min(1)
              .max(100000),
          })
          .strict()
          .optional(),
        route: z
          .object({
            unit: z.literal('degrees'),
            samples: z
              .array(
                z
                  .object({
                    timestamp: instant,
                    latitude: z.number().finite().min(-90).max(90),
                    longitude: z.number().finite().min(-180).max(180),
                  })
                  .strict(),
              )
              .min(1)
              .max(100000),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    events: z
      .array(
        z
          .object({
            type: z.enum(['PAUSE', 'RESUME']),
            timestamp: instant,
          })
          .strict(),
      )
      .max(1000)
      .optional(),
    laps: z
      .array(
        z
          .object({
            startDate: instant,
            endDate: instant,
            name: z.string().max(250).optional(),
          })
          .strict(),
      )
      .max(1000)
      .optional(),
  })
  .strict()
  .superRefine((workout, ctx) => {
    const start = Date.parse(workout.startDate);
    const end = Date.parse(workout.endDate);
    const elapsed = (end - start) / 1000;
    const issue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (
      elapsed <= 0 ||
      elapsed > 7 * 86400 ||
      Math.abs(elapsed - workout.elapsedDuration.value) > 1
    )
      issue(
        'Elapsed duration must agree with ordered start/end instants and be at most seven days',
      );
    if (workout.activeDuration && workout.activeDuration.value > elapsed)
      issue('Active duration exceeds elapsed duration');
    if (
      workout.source.recordingKind === 'multisport_leg' &&
      !workout.source.parentWorkoutUuid
    )
      issue('Multisport legs require their parent UUID');
    if (
      workout.source.recordingKind === 'single' &&
      workout.source.parentWorkoutUuid
    )
      issue('Single recordings cannot specify a multisport parent');
    let count = 0;
    for (const [key, value] of Object.entries(workout.streams ?? {})) {
      if (!value) continue;
      count += value.samples.length;
      let previous = -Infinity;
      let previousDistance = -Infinity;
      for (const entry of value.samples) {
        const time = Date.parse(entry.timestamp);
        if (time < start || time > end || time <= previous) {
          issue(
            `Channel ${key} must have strictly increasing timestamps inside the workout`,
          );
          break;
        }
        previous = time;
        if (key === 'distance' && 'value' in entry) {
          if (entry.value < previousDistance)
            issue('Distance samples must be cumulative');
          previousDistance = entry.value;
        }
      }
    }
    if (count > 100000) issue('At most 100000 samples across all channels');
    let paused = false;
    let previous = -Infinity;
    for (const event of workout.events ?? []) {
      const time = Date.parse(event.timestamp);
      if (
        time < start ||
        time > end ||
        time <= previous ||
        (event.type === 'PAUSE') === paused
      )
        issue(
          'Pause/resume events must alternate in timestamp order inside the workout',
        );
      paused = event.type === 'PAUSE';
      previous = time;
    }
    previous = start;
    for (const lap of workout.laps ?? []) {
      const a = Date.parse(lap.startDate),
        b = Date.parse(lap.endDate);
      if (a < previous || b <= a || b > end)
        issue('Laps must be ordered, nonoverlapping and inside the workout');
      previous = b;
    }
  });

export type ImportHealthkitWorkoutDto = z.infer<
  typeof importHealthkitWorkoutDtoSchema
>;
export type ActivityImportStatus =
  'created' | 'matched' | 'enriched' | 'unchanged' | 'needs_review';
export interface ImportHealthkitWorkoutResponseDto {
  receiptId: number;
  revision: number;
  status: ActivityImportStatus;
  eventActivityId: number | null;
  eventId: number | null;
  processing: 'queued' | 'not_required';
}
