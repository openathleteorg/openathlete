import type { LifecycleEmailKind } from '@openathlete/database';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** At most one email of the sequences every two days */
export const MIN_SPACING = 2 * DAY;
/** Sent between 8:00 and 20:59, the user's time */
export const FIRST_HOUR = 8;
export const LAST_HOUR = 20;

/** Activation emails go to new accounts only, not to everyone at launch */
const CONNECT_REMINDER_AFTER = DAY;
const CONNECT_REMINDER_UNTIL = 7 * DAY;
const CONNECT_QUESTION_AFTER = 4 * DAY;
const CONNECT_QUESTION_UNTIL = 14 * DAY;
const IMPORT_DONE_UNTIL = 30 * DAY;
const PLAN_NUDGE_AFTER_IMPORT = 7 * DAY;
/** A connection that broke longer ago than this is not news any more */
const CONNECTION_LOST_UNTIL = 60 * DAY;
const CANCELLATION_UNTIL = 14 * DAY;
/** The recap of a month goes out during the first week of the next */
const RECAP_LAST_DAY = 7;
const RECAP_MIN_ACTIVITIES = 4;
const SUPPORTER_ASK_AFTER = 30 * DAY;
const SUPPORTER_ASK_MIN_ACTIVITIES = 20;

export interface LifecycleState {
  now: Date;
  /** The user's local hour and day of month */
  localHour: number;
  localDay: number;
  createdAt: Date;
  emailTips: boolean;
  emailRecap: boolean;
  newsConsent: boolean;
  /** The instance sells Supporter subscriptions */
  billingEnabled: boolean;
  isSupporter: boolean;
  providers: {
    providerAccountId: number;
    status: 'active' | 'revoked';
    createdAt: Date;
    updatedAt: Date;
    fullImportCompletedAt: Date | null;
    disconnectedByUser: boolean;
  }[];
  activityCount: number;
  plannedCount: number;
  hasUpcomingRace: boolean;
  /** Activities of the previous calendar month (UTC) */
  previousMonthActivityCount: number;
  /** That month, as YYYY-MM */
  previousMonth: string;
  /** A Supporter subscription set to end, and since when */
  cancellation: { subscriptionId: number; at: Date } | null;
  sent: { kind: LifecycleEmailKind; ref: string; sentAt: Date }[];
}

export interface NextEmail {
  kind: LifecycleEmailKind;
  ref: string;
}

/**
 * The next email of the onboarding, recap and news sequences for one user,
 * or null. Each email stops as soon as the user did what it asks.
 */
export function nextLifecycleEmail(state: LifecycleState): NextEmail | null {
  if (state.localHour < FIRST_HOUR || state.localHour > LAST_HOUR) {
    return null;
  }
  const now = state.now.getTime();
  const age = now - state.createdAt.getTime();
  const wasSent = (kind: LifecycleEmailKind, ref = '') =>
    state.sent.some((email) => email.kind === kind && email.ref === ref);
  const sentAt = (kind: LifecycleEmailKind) =>
    state.sent.find((email) => email.kind === kind)?.sentAt;

  const active = state.providers.filter((p) => p.status === 'active');

  // Alerts first, and whatever the spacing: they are about something that
  // stopped working
  if (state.emailTips && active.length === 0) {
    const lost = state.providers.find(
      (p) =>
        p.status === 'revoked' &&
        !p.disconnectedByUser &&
        now - p.updatedAt.getTime() <= CONNECTION_LOST_UNTIL &&
        !wasSent('CONNECTION_LOST', String(p.providerAccountId)),
    );
    if (lost) {
      return { kind: 'CONNECTION_LOST', ref: String(lost.providerAccountId) };
    }
  }

  if (
    state.cancellation &&
    !state.isSupporter &&
    now - state.cancellation.at.getTime() <= CANCELLATION_UNTIL &&
    !wasSent('SUPPORTER_CANCELLED', String(state.cancellation.subscriptionId))
  ) {
    return {
      kind: 'SUPPORTER_CANCELLED',
      ref: String(state.cancellation.subscriptionId),
    };
  }

  const lastSent = Math.max(0, ...state.sent.map((e) => e.sentAt.getTime()));
  if (now - lastSent < MIN_SPACING) return null;

  if (state.emailTips) {
    const neverConnected =
      state.providers.length === 0 && state.activityCount === 0;
    if (neverConnected) {
      if (
        age >= CONNECT_REMINDER_AFTER &&
        age <= CONNECT_REMINDER_UNTIL &&
        !wasSent('CONNECT_REMINDER')
      ) {
        return { kind: 'CONNECT_REMINDER', ref: '' };
      }
      if (
        age >= CONNECT_QUESTION_AFTER &&
        age <= CONNECT_QUESTION_UNTIL &&
        wasSent('CONNECT_REMINDER') &&
        !wasSent('CONNECT_QUESTION')
      ) {
        return { kind: 'CONNECT_QUESTION', ref: '' };
      }
    }

    // Once the history arrived: when the provider says it is all there, or
    // a day after connecting for those that send it as it comes
    const historyIn = active.some(
      (p) =>
        p.fullImportCompletedAt !== null || now - p.createdAt.getTime() >= DAY,
    );
    if (
      state.activityCount > 0 &&
      historyIn &&
      age <= IMPORT_DONE_UNTIL &&
      !wasSent('IMPORT_DONE')
    ) {
      return { kind: 'IMPORT_DONE', ref: '' };
    }

    const importDoneAt = sentAt('IMPORT_DONE');
    if (
      importDoneAt &&
      now - importDoneAt.getTime() >= PLAN_NUDGE_AFTER_IMPORT &&
      state.plannedCount === 0 &&
      !state.hasUpcomingRace &&
      !wasSent('PLAN_NUDGE')
    ) {
      return { kind: 'PLAN_NUDGE', ref: '' };
    }
  }

  if (
    state.emailRecap &&
    state.localDay <= RECAP_LAST_DAY &&
    state.previousMonthActivityCount >= RECAP_MIN_ACTIVITIES &&
    !wasSent('MONTHLY_RECAP', state.previousMonth)
  ) {
    return { kind: 'MONTHLY_RECAP', ref: state.previousMonth };
  }

  const firstConnection = Math.min(
    ...state.providers.map((p) => p.createdAt.getTime()),
  );
  if (
    state.newsConsent &&
    state.billingEnabled &&
    !state.isSupporter &&
    state.providers.length > 0 &&
    now - firstConnection >= SUPPORTER_ASK_AFTER &&
    state.activityCount >= SUPPORTER_ASK_MIN_ACTIVITIES &&
    !wasSent('SUPPORTER_ASK')
  ) {
    return { kind: 'SUPPORTER_ASK', ref: '' };
  }

  return null;
}
