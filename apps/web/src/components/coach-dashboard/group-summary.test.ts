import { describe, expect, it } from 'vitest';

import { CoachDashboardAthleteRowDto } from '@openathlete/shared';

import { summarizeGroup } from './group-summary';

const row = (
  overrides: Partial<CoachDashboardAthleteRowDto>,
): CoachDashboardAthleteRowDto => ({
  athleteId: 1,
  firstName: 'Ana',
  lastName: 'Test',
  email: null,
  start: '2026-11-01',
  end: '2026-11-28',
  plannedSessions: 0,
  completedSessions: 0,
  plannedTime: 0,
  completedTime: 0,
  completedDistance: 0,
  lastActivityAt: null,
  compliancePercent: 0,
  form: null,
  alerts: [],
  unreadMessages: 0,
  averageRpe: null,
  metrics: {},
  previous: null,
  ...overrides,
});

describe('summarizeGroup', () => {
  it('weighs compliance by session, not by athlete', () => {
    const summary = summarizeGroup([
      row({ plannedSessions: 1, completedSessions: 0 }),
      row({ plannedSessions: 9, completedSessions: 9 }),
    ]);
    expect(summary.compliancePercent).toBe(90);
    expect(summary.completedSessions).toBe(9);
  });

  it('caps compliance at 100 when athletes did more than planned', () => {
    expect(
      summarizeGroup([row({ plannedSessions: 2, completedSessions: 5 })])
        .compliancePercent,
    ).toBe(100);
  });

  it('says nothing about compliance or form it cannot know', () => {
    const summary = summarizeGroup([row({}), row({})]);
    expect(summary.compliancePercent).toBeNull();
    expect(summary.averageTsb).toBeNull();
    expect(summary.athletes).toBe(2);
  });

  it('averages the form of those who have one, and counts who to watch', () => {
    const summary = summarizeGroup([
      row({ form: { ctl: 50, atl: 60, tsb: -10 } }),
      row({ form: { ctl: 40, atl: 36, tsb: 4 } }),
      row({ alerts: [{ type: 'inactive', days: 9 }] }),
      row({ unreadMessages: 2, completedTime: 3600 }),
    ]);
    expect(summary.averageTsb).toBe(-3);
    expect(summary.toWatch).toBe(2);
    expect(summary.completedTime).toBe(3600);
  });
});
