import { CoachDashboardAthleteRowDto } from '@openathlete/shared';

export type GroupSummary = {
  athletes: number;
  plannedSessions: number;
  completedSessions: number;
  /** Done over planned sessions, null when nothing was planned */
  compliancePercent: number | null;
  /** Seconds of activity over the period, all athletes together */
  completedTime: number;
  /** Mean form (TSB) of the athletes who have one, null when none has */
  averageTsb: number | null;
  /** Athletes with an alert or a message to read */
  toWatch: number;
};

/**
 * What a group did over the period. Sessions are summed before dividing,
 * so an athlete with one planned session weighs as much as one session,
 * not as much as an athlete with ten.
 */
export function summarizeGroup(
  rows: CoachDashboardAthleteRowDto[],
): GroupSummary {
  const sum = (pick: (row: CoachDashboardAthleteRowDto) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  const plannedSessions = sum((row) => row.plannedSessions);
  const completedSessions = sum((row) => row.completedSessions);
  const forms = rows.flatMap((row) => (row.form ? [row.form.tsb] : []));
  return {
    athletes: rows.length,
    plannedSessions,
    completedSessions,
    compliancePercent:
      plannedSessions > 0
        ? Math.round(
            (Math.min(completedSessions, plannedSessions) / plannedSessions) *
              100,
          )
        : null,
    completedTime: sum((row) => row.completedTime),
    averageTsb: forms.length
      ? forms.reduce((total, tsb) => total + tsb, 0) / forms.length
      : null,
    toWatch: rows.filter(
      (row) => row.alerts.length > 0 || row.unreadMessages > 0,
    ).length,
  };
}
