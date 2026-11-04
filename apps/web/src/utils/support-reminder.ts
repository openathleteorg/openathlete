import { purchaseChannel } from './capacitor';

export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/openathlete';

const DAYS_BEFORE_REMINDER = 30;

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
  return usedFor >= DAYS_BEFORE_REMINDER * 24 * 60 * 60 * 1000;
}

interface SupporterReminderState {
  billingEnabled: boolean;
  isSupporter: boolean;
  dismissed: boolean;
  fullImportsCompletedAt: (string | null)[];
  now: Date;
}

/**
 * On the hosted instance, the same request points to Supporter, a month
 * after the history came in: by then the app has proved itself. Only on
 * the web, where Stripe sells it.
 */
export function shouldShowSupporterReminder({
  billingEnabled,
  isSupporter,
  dismissed,
  fullImportsCompletedAt,
  now,
}: SupporterReminderState): boolean {
  if (!billingEnabled || isSupporter || dismissed) return false;
  if (purchaseChannel() !== 'stripe') return false;
  const monthAgo = now.getTime() - DAYS_BEFORE_REMINDER * 24 * 60 * 60 * 1000;
  return fullImportsCompletedAt.some(
    (completedAt) =>
      completedAt !== null && new Date(completedAt).getTime() <= monthAgo,
  );
}
