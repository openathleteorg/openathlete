import { purchaseChannel } from './capacitor';

export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/openathlete';

const DAYS_BEFORE_REMINDER = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ReminderState {
  /** The instance sells Supporter subscriptions: the hosted one */
  billingEnabled: boolean;
  dismissed: boolean;
  /** When the account was created */
  accountCreatedAt: Date;
  /** When each connected provider finished importing the history */
  fullImportsCompletedAt: (string | null)[];
  now: Date;
}

/**
 * Self-hosters pay us nothing, so they are asked for a coffee once, at a
 * moment the app proved useful: after the first sync went through, or after
 * a month of use. The hosted instance sells Supporter instead, and the
 * stores forbid pointing to outside payments.
 */
export function shouldShowSupportReminder({
  billingEnabled,
  dismissed,
  accountCreatedAt,
  fullImportsCompletedAt,
  now,
}: ReminderState): boolean {
  if (billingEnabled || dismissed || purchaseChannel() !== 'stripe') {
    return false;
  }
  if (fullImportsCompletedAt.some((completedAt) => completedAt !== null)) {
    return true;
  }
  const usedFor = now.getTime() - accountCreatedAt.getTime();
  return usedFor >= DAYS_BEFORE_REMINDER * DAY_MS;
}

interface SupporterReminderState {
  billingEnabled: boolean;
  isSupporter: boolean;
  /** When the request was last dismissed */
  dismissedAt: Date | null;
  /** How many times it was dismissed */
  dismissCount: number;
  fullImportsCompletedAt: (string | null)[];
  now: Date;
}

/** The Supporter request comes back this long after it was dismissed */
export const SUPPORTER_REMINDER_SNOOZE_DAYS = 90;
/** Dismissed this many times, it never comes back */
export const SUPPORTER_REMINDER_MAX_DISMISSALS = 3;

/**
 * On the hosted instance, the request points to Supporter, a month after
 * the history came in: by then the app has proved itself. Dismissed, it
 * comes back a season later, a few times at most. On the web and in the
 * iOS app, which both sell it; never in the Android app.
 */
export function shouldShowSupporterReminder({
  billingEnabled,
  isSupporter,
  dismissedAt,
  dismissCount,
  fullImportsCompletedAt,
  now,
}: SupporterReminderState): boolean {
  if (!billingEnabled || isSupporter || purchaseChannel() === null) {
    return false;
  }
  if (dismissCount >= SUPPORTER_REMINDER_MAX_DISMISSALS) return false;
  if (
    dismissedAt &&
    now.getTime() - dismissedAt.getTime() <
      SUPPORTER_REMINDER_SNOOZE_DAYS * DAY_MS
  ) {
    return false;
  }
  const monthAgo = now.getTime() - DAYS_BEFORE_REMINDER * DAY_MS;
  return fullImportsCompletedAt.some(
    (completedAt) =>
      completedAt !== null && new Date(completedAt).getTime() <= monthAgo,
  );
}

/** Supporter mentions in context (a race, the year review, an AI preview) */
export const SUPPORTER_NUDGE_INTERVAL_DAYS = 14;

interface SupporterNudgeState {
  billingEnabled: boolean;
  isSupporter: boolean;
  /** When the app last showed one */
  seenAt: Date | null;
  now: Date;
}

/**
 * Whether the app may mention Supporter where it just proved useful: on the
 * hosted instance, to someone who is not one yet, one mention every two
 * weeks at most, wherever it comes from.
 */
export function supporterNudgeAllowed({
  billingEnabled,
  isSupporter,
  seenAt,
  now,
}: SupporterNudgeState): boolean {
  if (!billingEnabled || isSupporter || purchaseChannel() === null) {
    return false;
  }
  return (
    !seenAt ||
    now.getTime() - seenAt.getTime() >= SUPPORTER_NUDGE_INTERVAL_DAYS * DAY_MS
  );
}
