import { Language } from 'src/common/constants/languages.constant';

import type { PushNotificationTranslation } from './translations';

type Texts = {
  request: (coach: string, title: string) => PushNotificationTranslation;
  reminder: (coach: string, title: string) => PushNotificationTranslation;
};

const translations: Record<Language, Texts> = {
  [Language.FR]: {
    request: (coach, title) => ({
      title: `Questionnaire de ${coach}`,
      body: `« ${title} » vous attend.`,
    }),
    reminder: (coach, title) => ({
      title: `Questionnaire de ${coach}`,
      body: `« ${title} » attend toujours votre réponse.`,
    }),
  },
  [Language.EN]: {
    request: (coach, title) => ({
      title: `Questionnaire from ${coach}`,
      body: `"${title}" is waiting for you.`,
    }),
    reminder: (coach, title) => ({
      title: `Questionnaire from ${coach}`,
      body: `"${title}" is still waiting for your answer.`,
    }),
  },
  [Language.IT]: {
    request: (coach, title) => ({
      title: `Questionario di ${coach}`,
      body: `«${title}» ti aspetta.`,
    }),
    reminder: (coach, title) => ({
      title: `Questionario di ${coach}`,
      body: `«${title}» aspetta ancora la tua risposta.`,
    }),
  },
  [Language.ES]: {
    request: (coach, title) => ({
      title: `Cuestionario de ${coach}`,
      body: `«${title}» te espera.`,
    }),
    reminder: (coach, title) => ({
      title: `Cuestionario de ${coach}`,
      body: `«${title}» sigue esperando tu respuesta.`,
    }),
  },
  [Language.PT_BR]: {
    request: (coach, title) => ({
      title: `Questionário de ${coach}`,
      body: `“${title}” está esperando por você.`,
    }),
    reminder: (coach, title) => ({
      title: `Questionário de ${coach}`,
      body: `“${title}” ainda espera a sua resposta.`,
    }),
  },
  [Language.DE]: {
    request: (coach, title) => ({
      title: `Fragebogen von ${coach}`,
      body: `„${title}“ wartet auf dich.`,
    }),
    reminder: (coach, title) => ({
      title: `Fragebogen von ${coach}`,
      body: `„${title}“ wartet noch auf deine Antwort.`,
    }),
  },
};

/** The push telling an athlete their coach's questionnaire is open */
export function questionnaireNotification(
  language: Language,
  kind: 'request' | 'reminder',
  coach: string,
  title: string,
): PushNotificationTranslation {
  return (translations[language] ?? translations[Language.EN])[kind](
    coach,
    title,
  );
}
