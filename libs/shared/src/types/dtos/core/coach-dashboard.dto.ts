import z from 'zod';

export const coachDashboardAthleteRowSchema = z.object({
  athleteId: z.number(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email().nullable(),

  // Period boundaries (ISO strings)
  start: z.string(),
  end: z.string(),

  // Session counts
  plannedSessions: z.number(),
  completedSessions: z.number(),

  // Time volumes in seconds
  plannedTime: z.number(),
  completedTime: z.number(),

  // Distance in meters
  completedDistance: z.number(),

  // Last activity date if any
  lastActivityAt: z.string().nullable(),

  // Compliance percentage (0-100)
  compliancePercent: z.number(),
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


