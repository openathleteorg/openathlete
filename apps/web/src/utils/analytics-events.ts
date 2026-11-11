/**
 * PostHog event names and small helpers for `apps/web` product analytics.
 * Do not send PII, free-text prompts, or raw error messages — use codes only.
 *
 * Manual verification: PostHog → Live events while walking through:
 * onboarding, OAuth connect, calendar CRUD, AI dialogs, subscription, messages.
 *
 * The API sends what the browser cannot see, for users who consented:
 * account_created, activity_imported, provider_connection_lost,
 * athlete_invited, coach_invited, athlete_linked, coach_linked, checkout_started,
 * subscription_started, subscription_renewed, subscription_payment_failed,
 * subscription_cancel_scheduled, subscription_ended, subscription_refunded,
 * account_deleted, workout_sent_to_device, mcp_connected, ai_key_added,
 * ai_key_removed, lifecycle_email_sent. The funnels are in PostHog ("Churn
 * funnels" dashboard).
 *
 * Every event carries `platform` (web, ios, android), and `app_version` in the
 * native apps. Identified people carry roles, is_coach, plan, language,
 * onboarding_completed, acquisition_source and signed_up_at
 * (`analyticsPersonProperties`).
 */

export const AnalyticsEvent = {
  onboarding_step_completed: 'onboarding_step_completed',
  onboarding_abandoned: 'onboarding_abandoned',
  provider_connect_initiated: 'provider_connect_initiated',
  provider_connect_completed: 'provider_connect_completed',
  provider_connect_failed: 'provider_connect_failed',
  provider_sync_preference_changed: 'provider_sync_preference_changed',
  event_deleted: 'event_deleted',
  event_duplicated: 'event_duplicated',
  event_template_saved: 'event_template_saved',
  activity_linked: 'activity_linked',
  ai_event_generation_opened: 'ai_event_generation_opened',
  ai_event_generation_succeeded: 'ai_event_generation_succeeded',
  ai_event_generation_failed: 'ai_event_generation_failed',
  ai_paywall_viewed: 'ai_paywall_viewed',
  supporter_nudge_viewed: 'supporter_nudge_viewed',
  supporter_nudge_clicked: 'supporter_nudge_clicked',
  subscription_manage_billing_opened: 'subscription_manage_billing_opened',
  subscription_checkout_failed: 'subscription_checkout_failed',
  checkout_abandoned: 'checkout_abandoned',
  messages_thread_created: 'messages_thread_created',
  messages_thread_deleted: 'messages_thread_deleted',
  messages_message_sent: 'messages_message_sent',
  activity_feedback_answered: 'activity_feedback_answered',
  activity_feedback_skipped: 'activity_feedback_skipped',
  ai_custom_instructions_saved: 'ai_custom_instructions_saved',
  calendar_feed_copied: 'calendar_feed_copied',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/** Where OAuth was started (stored before redirect). */
export type OauthConnectSource = 'onboarding' | 'settings';

const OAUTH_CONNECT_SOURCE_SESSION_KEY = 'oa_ph_oauth_connect_source';

export function setOauthConnectSourceForRedirect(
  source: OauthConnectSource,
): void {
  try {
    sessionStorage.setItem(OAUTH_CONNECT_SOURCE_SESSION_KEY, source);
  } catch {
    // ignore quota / private mode
  }
}

export function consumeOauthConnectSource(): OauthConnectSource {
  try {
    const raw = sessionStorage.getItem(OAUTH_CONNECT_SOURCE_SESSION_KEY);
    sessionStorage.removeItem(OAUTH_CONNECT_SOURCE_SESSION_KEY);
    if (raw === 'onboarding' || raw === 'settings') {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'settings';
}

/** Stable code for PostHog breakdowns (no raw message). */
export function analyticsErrorCodeFromUnknown(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0 && msg.length < 80) {
      return msg.replaceAll(/\s+/g, '_').slice(0, 64);
    }
  }
  return 'unknown_error';
}
