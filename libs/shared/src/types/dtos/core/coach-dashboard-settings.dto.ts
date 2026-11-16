import { z } from 'zod';

import { DASHBOARD_METRIC_TYPES } from './coach-dashboard.dto';

/** The columns a coach can show in the dashboard table, in their order */
export const COACH_DASHBOARD_COLUMNS = [
  'sessions',
  'volume',
  'distance',
  'form',
  'rpe',
  'lastActivity',
  ...DASHBOARD_METRIC_TYPES,
] as const;
export type CoachDashboardColumn = (typeof COACH_DASHBOARD_COLUMNS)[number];

export const DEFAULT_COACH_DASHBOARD_COLUMNS: CoachDashboardColumn[] = [
  'sessions',
  'volume',
  'form',
  'lastActivity',
];

/**
 * How a coach set up their dashboard, kept with their account so it
 * follows them across devices. A stored value from an older version, or
 * none, still reads as a full one.
 */
export const coachDashboardSettingsSchema = z.object({
  columns: z
    .array(z.enum(COACH_DASHBOARD_COLUMNS))
    .max(COACH_DASHBOARD_COLUMNS.length)
    .catch(DEFAULT_COACH_DASHBOARD_COLUMNS),
});
export type CoachDashboardSettings = z.infer<
  typeof coachDashboardSettingsSchema
>;

export function readCoachDashboardSettings(
  value: unknown,
): CoachDashboardSettings {
  const parsed = coachDashboardSettingsSchema.safeParse(
    value && typeof value === 'object' ? value : {},
  );
  return parsed.success
    ? {
        columns: [
          ...new Set(parsed.data.columns ?? DEFAULT_COACH_DASHBOARD_COLUMNS),
        ],
      }
    : { columns: DEFAULT_COACH_DASHBOARD_COLUMNS };
}
