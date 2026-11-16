import { Language } from 'src/common/constants/languages.constant';

import type { PushNotificationTranslation } from './translations';

type Change = 'canceled' | 'changed';

const copy: Record<
  Language,
  (club: string, title: string, date: string) => Record<Change, string>
> = {
  [Language.FR]: (club, title, date) => ({
    canceled: `${club} : « ${title} » du ${date} est annulée.`,
    changed: `${club} : « ${title} » a changé, regardez votre calendrier.`,
  }),
  [Language.EN]: (club, title, date) => ({
    canceled: `${club}: "${title}" on ${date} is called off.`,
    changed: `${club}: "${title}" changed, see your calendar.`,
  }),
  [Language.IT]: (club, title, date) => ({
    canceled: `${club}: «${title}» del ${date} è annullata.`,
    changed: `${club}: «${title}» è cambiata, guarda il tuo calendario.`,
  }),
  [Language.ES]: (club, title, date) => ({
    canceled: `${club}: «${title}» del ${date} queda cancelada.`,
    changed: `${club}: «${title}» ha cambiado, mira tu calendario.`,
  }),
  [Language.PT_BR]: (club, title, date) => ({
    canceled: `${club}: "${title}" de ${date} foi cancelada.`,
    changed: `${club}: "${title}" mudou, veja seu calendário.`,
  }),
  [Language.DE]: (club, title, date) => ({
    canceled: `${club}: „${title}“ am ${date} fällt aus.`,
    changed: `${club}: „${title}“ hat sich geändert, sieh in deinen Kalender.`,
  }),
};

/** An athlete's notice that a club session they were sent changed. */
export function clubSessionNotification(
  language: Language,
  change: Change,
  { club, title, date }: { club: string; title: string; date: string },
): PushNotificationTranslation {
  const texts = (copy[language] ?? copy[Language.EN])(club, title, date);
  return { title: club, body: texts[change] };
}
