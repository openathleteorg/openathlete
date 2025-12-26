import { Language } from 'src/common/constants/languages.constant';

/**
 * Types of push notifications available in the system.
 * Add new notification types here as needed.
 */
export type PushNotificationType = 'activity_processed';

/**
 * Final translation object returned by getPushNotificationTranslation.
 */
export interface PushNotificationTranslation {
  title: string;
  body: string;
}

/**
 * Dynamic body structure for notifications that need conditional text.
 * Use this when the body depends on options (e.g., hasQuestions).
 */
type DynamicBody = {
  withQuestions: string;
  withoutQuestions: string;
};

/**
 * Translation configuration for a single notification type and language.
 * The body can be either a static string or a DynamicBody object.
 */
type PushNotificationTranslationConfig = {
  title: string;
  body: string | DynamicBody;
};

/**
 * Map of all push notification translations.
 * Structure: { notificationType: { language: { title, body } } }
 */
type PushNotificationTranslationsMap = {
  [K in PushNotificationType]: Record<
    Language,
    PushNotificationTranslationConfig
  >;
};

/**
 * All push notification translations.
 * To add a new notification type:
 * 1. Add the type to PushNotificationType
 * 2. Add translations for all languages here
 * 3. Update the options type in getPushNotificationTranslation if needed
 */
const pushNotificationTranslations: PushNotificationTranslationsMap = {
  activity_processed: {
    [Language.FR]: {
      title: 'Activité traitée',
      body: {
        withQuestions:
          'Votre activité a été analysée et des questions de feedback sont disponibles.',
        withoutQuestions: 'Votre activité a été analysée avec succès.',
      },
    },
    [Language.EN]: {
      title: 'Activity processed',
      body: {
        withQuestions:
          'Your activity has been analyzed and feedback questions are available.',
        withoutQuestions: 'Your activity has been successfully analyzed.',
      },
    },
  },
} as const;

/**
 * Get translated push notification content for a given type and language.
 *
 * @param type - The type of push notification
 * @param language - The user's language preference
 * @param options - Optional parameters for dynamic translations (e.g., hasQuestions)
 * @returns Translated title and body for the notification
 *
 * @example
 * ```ts
 * const translation = getPushNotificationTranslation(
 *   'activity_processed',
 *   Language.FR,
 *   { hasQuestions: true }
 * );
 * ```
 */
export function getPushNotificationTranslation(
  type: PushNotificationType,
  language: Language,
  options?: { hasQuestions?: boolean },
): PushNotificationTranslation {
  const translation = pushNotificationTranslations[type][language];

  let body: string;
  if (typeof translation.body === 'string') {
    body = translation.body;
  } else {
    // Dynamic body based on options
    body =
      options?.hasQuestions === true
        ? translation.body.withQuestions
        : translation.body.withoutQuestions;
  }

  return {
    title: translation.title,
    body,
  };
}
