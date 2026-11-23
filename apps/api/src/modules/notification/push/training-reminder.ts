import { Language } from 'src/common/constants/languages.constant';

import type { PushNotificationTranslation } from './translations';

/** Polish takes "treningi" after 2-4, 22-24..., but not 12-14 */
const polishFew = (count: number) =>
  count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14);

const translations: Record<
  Language,
  { title: string; many: (count: number, names: string) => string }
> = {
  [Language.FR]: {
    title: 'Demain',
    many: (count, names) => `${count} séances : ${names}`,
  },
  [Language.EN]: {
    title: 'Tomorrow',
    many: (count, names) => `${count} sessions: ${names}`,
  },
  [Language.IT]: {
    title: 'Domani',
    many: (count, names) => `${count} sedute: ${names}`,
  },
  [Language.ES]: {
    title: 'Mañana',
    many: (count, names) => `${count} sesiones: ${names}`,
  },
  [Language.PT_BR]: {
    title: 'Amanhã',
    many: (count, names) => `${count} sessões: ${names}`,
  },
  [Language.DE]: {
    title: 'Morgen',
    many: (count, names) => `${count} Einheiten: ${names}`,
  },
  [Language.PL]: {
    title: 'Jutro',
    many: (count, names) =>
      `${count} ${polishFew(count) ? 'treningi' : 'treningów'}: ${names}`,
  },
  [Language.NL]: {
    title: 'Morgen',
    many: (count, names) => `${count} trainingen: ${names}`,
  },
};

/** The evening reminder of the next day's planned sessions. */
export function trainingReminderNotification(
  language: Language,
  sessionNames: string[],
): PushNotificationTranslation {
  const { title, many } = translations[language];
  return {
    title,
    body:
      sessionNames.length === 1
        ? sessionNames[0]
        : many(sessionNames.length, sessionNames.join(', ')),
  };
}
