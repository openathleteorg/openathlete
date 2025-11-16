import z from 'zod';

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
  lastActivityAt: z.string().nullable(),
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
