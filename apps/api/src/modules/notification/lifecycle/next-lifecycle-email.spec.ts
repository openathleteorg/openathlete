import { LifecycleState, nextLifecycleEmail } from './next-lifecycle-email';

const NOW = new Date('2026-11-10T10:00:00Z');
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms);

function state(overrides: Partial<LifecycleState> = {}): LifecycleState {
  return {
    now: NOW,
    localHour: 10,
    localDay: 10,
    createdAt: ago(2 * DAY),
    emailTips: true,
    emailRecap: true,
    newsConsent: false,
    billingEnabled: true,
    isSupporter: false,
    providers: [],
    activityCount: 0,
    plannedCount: 0,
    hasUpcomingRace: false,
    previousMonthActivityCount: 0,
    previousMonth: '2026-10',
    cancellation: null,
    sent: [],
    ...overrides,
  };
}

const garmin = (
  overrides: Partial<LifecycleState['providers'][number]> = {},
): LifecycleState['providers'][number] => ({
  providerAccountId: 5,
  status: 'active',
  createdAt: ago(3 * DAY),
  updatedAt: ago(3 * DAY),
  fullImportCompletedAt: ago(3 * DAY),
  disconnectedByUser: false,
  ...overrides,
});

describe('nextLifecycleEmail', () => {
  it('sends nothing at night', () => {
    expect(nextLifecycleEmail(state({ localHour: 6 }))).toBeNull();
    expect(nextLifecycleEmail(state({ localHour: 22 }))).toBeNull();
  });

  describe('activation', () => {
    it('reminds to connect a watch a day after signing up', () => {
      expect(
        nextLifecycleEmail(state({ createdAt: ago(20 * HOUR) })),
      ).toBeNull();
      expect(nextLifecycleEmail(state())).toEqual({
        kind: 'CONNECT_REMINDER',
        ref: '',
      });
    });

    it('leaves alone accounts older than a week, which never had it', () => {
      expect(nextLifecycleEmail(state({ createdAt: ago(8 * DAY) }))).toBeNull();
    });

    it('asks what got in the way after four days, once reminded', () => {
      const reminded = state({
        createdAt: ago(5 * DAY),
        sent: [{ kind: 'CONNECT_REMINDER', ref: '', sentAt: ago(3 * DAY) }],
      });
      expect(nextLifecycleEmail(reminded)).toEqual({
        kind: 'CONNECT_QUESTION',
        ref: '',
      });
    });

    it('waits two days between two emails', () => {
      const justReminded = state({
        createdAt: ago(5 * DAY),
        sent: [{ kind: 'CONNECT_REMINDER', ref: '', sentAt: ago(DAY) }],
      });
      expect(nextLifecycleEmail(justReminded)).toBeNull();
    });

    it('stops the reminders once a watch is connected', () => {
      expect(
        nextLifecycleEmail(
          state({
            providers: [
              garmin({ fullImportCompletedAt: null, createdAt: ago(HOUR) }),
            ],
          }),
        ),
      ).toBeNull();
    });

    it('tells when the history is in', () => {
      expect(
        nextLifecycleEmail(state({ providers: [garmin()], activityCount: 40 })),
      ).toEqual({ kind: 'IMPORT_DONE', ref: '' });
    });

    it('waits a day for providers without a full import', () => {
      const polar = garmin({
        fullImportCompletedAt: null,
        createdAt: ago(3 * HOUR),
      });
      expect(
        nextLifecycleEmail(state({ providers: [polar], activityCount: 2 })),
      ).toBeNull();
      expect(
        nextLifecycleEmail(
          state({
            providers: [{ ...polar, createdAt: ago(DAY) }],
            activityCount: 2,
          }),
        ),
      ).toEqual({ kind: 'IMPORT_DONE', ref: '' });
    });

    it('suggests planning a week later, unless something is planned', () => {
      const imported = {
        providers: [garmin()],
        activityCount: 40,
        createdAt: ago(10 * DAY),
        sent: [{ kind: 'IMPORT_DONE' as const, ref: '', sentAt: ago(8 * DAY) }],
      };
      expect(nextLifecycleEmail(state(imported))).toEqual({
        kind: 'PLAN_NUDGE',
        ref: '',
      });
      expect(
        nextLifecycleEmail(state({ ...imported, plannedCount: 1 })),
      ).toBeNull();
      expect(
        nextLifecycleEmail(state({ ...imported, hasUpcomingRace: true })),
      ).toBeNull();
    });

    it('sends no tips to those who turned them off', () => {
      expect(nextLifecycleEmail(state({ emailTips: false }))).toBeNull();
    });
  });

  describe('lost connection', () => {
    const lost = garmin({ status: 'revoked', updatedAt: ago(HOUR) });

    it('says when the sync stopped, even right after another email', () => {
      expect(
        nextLifecycleEmail(
          state({
            createdAt: ago(90 * DAY),
            providers: [lost],
            sent: [
              { kind: 'MONTHLY_RECAP', ref: '2026-10', sentAt: ago(HOUR) },
            ],
          }),
        ),
      ).toEqual({ kind: 'CONNECTION_LOST', ref: '5' });
    });

    it('stays quiet when the user disconnected it, or another one works', () => {
      expect(
        nextLifecycleEmail(
          state({
            createdAt: ago(90 * DAY),
            providers: [{ ...lost, disconnectedByUser: true }],
          }),
        ),
      ).toBeNull();
      expect(
        nextLifecycleEmail(
          state({
            createdAt: ago(90 * DAY),
            providers: [lost, garmin({ providerAccountId: 6 })],
            sent: [{ kind: 'IMPORT_DONE', ref: '', sentAt: ago(80 * DAY) }],
            plannedCount: 3,
          }),
        ),
      ).toBeNull();
    });

    it('says it once per connection', () => {
      expect(
        nextLifecycleEmail(
          state({
            createdAt: ago(90 * DAY),
            providers: [lost],
            sent: [{ kind: 'CONNECTION_LOST', ref: '5', sentAt: ago(3 * DAY) }],
          }),
        ),
      ).toBeNull();
    });
  });

  describe('monthly recap', () => {
    const regular = {
      createdAt: ago(200 * DAY),
      providers: [garmin({ createdAt: ago(200 * DAY) })],
      activityCount: 300,
      plannedCount: 10,
      previousMonthActivityCount: 12,
      localDay: 2,
    };

    it('recaps the past month during the first week', () => {
      expect(nextLifecycleEmail(state(regular))).toEqual({
        kind: 'MONTHLY_RECAP',
        ref: '2026-10',
      });
      expect(nextLifecycleEmail(state({ ...regular, localDay: 8 }))).toBeNull();
    });

    it('skips quiet months, months already recapped, and those who opted out', () => {
      expect(
        nextLifecycleEmail(
          state({ ...regular, previousMonthActivityCount: 3 }),
        ),
      ).toBeNull();
      expect(
        nextLifecycleEmail(
          state({
            ...regular,
            sent: [
              { kind: 'MONTHLY_RECAP', ref: '2026-10', sentAt: ago(3 * DAY) },
            ],
          }),
        ),
      ).toBeNull();
      expect(
        nextLifecycleEmail(state({ ...regular, emailRecap: false })),
      ).toBeNull();
    });
  });

  describe('Supporter', () => {
    const settled = {
      createdAt: ago(60 * DAY),
      providers: [garmin({ createdAt: ago(40 * DAY) })],
      activityCount: 25,
      plannedCount: 4,
      newsConsent: true,
    };

    it('asks once, a month after the first sync, those who agreed to news', () => {
      expect(nextLifecycleEmail(state(settled))).toEqual({
        kind: 'SUPPORTER_ASK',
        ref: '',
      });
      expect(
        nextLifecycleEmail(
          state({
            ...settled,
            sent: [{ kind: 'SUPPORTER_ASK', ref: '', sentAt: ago(30 * DAY) }],
          }),
        ),
      ).toBeNull();
    });

    it('never asks without consent, billing, enough use, or when already Supporter', () => {
      expect(
        nextLifecycleEmail(state({ ...settled, newsConsent: false })),
      ).toBeNull();
      expect(
        nextLifecycleEmail(state({ ...settled, billingEnabled: false })),
      ).toBeNull();
      expect(
        nextLifecycleEmail(state({ ...settled, activityCount: 19 })),
      ).toBeNull();
      expect(
        nextLifecycleEmail(state({ ...settled, isSupporter: true })),
      ).toBeNull();
      expect(
        nextLifecycleEmail(
          state({
            ...settled,
            providers: [garmin({ createdAt: ago(20 * DAY) })],
          }),
        ),
      ).toBeNull();
    });

    it('asks a Supporter who cancelled why, once', () => {
      const cancellation = { subscriptionId: 9, at: ago(DAY) };
      expect(
        nextLifecycleEmail(
          state({ ...settled, newsConsent: false, cancellation }),
        ),
      ).toEqual({ kind: 'SUPPORTER_CANCELLED', ref: '9' });
      expect(
        nextLifecycleEmail(
          state({
            ...settled,
            newsConsent: false,
            cancellation,
            sent: [
              { kind: 'SUPPORTER_CANCELLED', ref: '9', sentAt: ago(HOUR) },
            ],
          }),
        ),
      ).toBeNull();
    });
  });
});
