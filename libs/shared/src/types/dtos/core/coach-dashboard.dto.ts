import z from 'zod';

export const coachAlertSchema = z.discriminatedUnion('type', [
  /** Pain reported in feedback and not resolved */
  z.object({
    type: z.literal('pain'),
    location: z.string(),
    painScore: z.number(),
  }),
  /** No activity for a while; days is null when there was never any */
  z.object({ type: z.literal('inactive'), days: z.number().nullable() }),
  /** A metric the coach watches went past the bounds they set */
  z.object({
    type: z.literal('threshold'),
    metricType: z.string(),
    value: z.number(),
    min: z.number().nullable(),
    max: z.number().nullable(),
    /** The day of the value (YYYY-MM-DD) */
    date: z.string(),
  }),
]);

/**
 * Daily metrics the dashboard can show as columns: recovery and body
 * composition, the latest value of the last days.
 */
export const DASHBOARD_METRIC_TYPES = [
  'HRV_LAST_NIGHT_AVG',
  'SLEEP_DURATION',
  'SLEEP_SCORE',
  'HR_REST',
  'WEIGHT',
] as const;
export type DashboardMetricType = (typeof DASHBOARD_METRIC_TYPES)[number];

const periodTotalsSchema = z.object({
  plannedSessions: z.number(),
  completedSessions: z.number(),
  completedTime: z.number(),
  completedDistance: z.number(),
});
export type CoachPeriodTotalsDto = z.infer<typeof periodTotalsSchema>;

export type CoachAlertDto = z.infer<typeof coachAlertSchema>;

export const coachDashboardAthleteRowSchema = z.object({
  athleteId: z.number(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email().nullable(),
  start: z.string(),
  end: z.string(),
  plannedSessions: z.number(),
  completedSessions: z.number(),
  plannedTime: z.number(),
  completedTime: z.number(),
  completedDistance: z.number(),
  /** Latest activity ever, not only in the period */
  lastActivityAt: z.string().nullable(),
  compliancePercent: z.number(),
  /** Fitness (CTL), fatigue (ATL) and form (TSB) today, from TRIMP */
  form: z
    .object({
      ctl: z.number(),
      atl: z.number(),
      tsb: z.number(),
    })
    .nullable(),
  /** What the coach should look at, the most urgent first */
  alerts: z.array(coachAlertSchema),
  /** Messages from the athlete the coach has not read */
  unreadMessages: z.number(),
  /** Mean RPE of the activities rated in the period, null without any */
  averageRpe: z.number().nullable(),
  /**
   * Latest value of each daily metric of the last days, by metric type: the
   * dashboard's metrics, and those the coach set thresholds on
   */
  metrics: z.record(
    z.string(),
    z.object({ value: z.number(), date: z.string() }),
  ),
  /** The same figures over the period before, when asked for */
  previous: periodTotalsSchema.nullable(),
});

export const coachDashboardResponseSchema = z.object({
  period: z.object({ start: z.string(), end: z.string() }),
  athletes: z.array(coachDashboardAthleteRowSchema),
});

export type CoachDashboardAthleteRowDto = z.infer<
  typeof coachDashboardAthleteRowSchema
>;

export type CoachDashboardResponseDto = z.infer<
  typeof coachDashboardResponseSchema
>;
