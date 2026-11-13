import type { LifecycleEmailKind } from '@openathlete/database';
import type { EmailLanguage } from '@openathlete/shared';

import { EmailList } from './unsubscribe-token';

/** The setting that turns each email off; none for a reply to a purchase */
export const LIST_OF_KIND: Record<LifecycleEmailKind, EmailList | null> = {
  CONNECT_REMINDER: 'tips',
  CONNECT_QUESTION: 'tips',
  IMPORT_DONE: 'tips',
  PLAN_NUDGE: 'tips',
  CONNECTION_LOST: 'tips',
  MONTHLY_RECAP: 'recap',
  SUPPORTER_ASK: 'news',
  SUPPORTER_CANCELLED: null,
};

/** Why the person gets the emails of a list, at their foot */
export const LIST_REASONS: Record<EmailList, Record<EmailLanguage, string>> = {
  tips: {
    FR: 'Vous recevez ces conseils parce que vous avez un compte OpenAthlete.',
    EN: 'You get these tips because you have an OpenAthlete account.',
    IT: 'Ricevi questi consigli perché hai un account OpenAthlete.',
    ES: 'Recibes estos consejos porque tienes una cuenta de OpenAthlete.',
    PT_BR: 'Você recebe estas dicas porque tem uma conta no OpenAthlete.',
    DE: 'Du erhältst diese Tipps, weil du ein OpenAthlete-Konto hast.',
  },
  recap: {
    FR: 'Vous recevez ce récapitulatif chaque mois où vous vous entraînez.',
    EN: 'You get this recap each month you train.',
    IT: 'Ricevi questo riepilogo ogni mese in cui ti alleni.',
    ES: 'Recibes este resumen cada mes que entrenas.',
    PT_BR: 'Você recebe este resumo todo mês em que treina.',
    DE: 'Du erhältst diesen Rückblick in jedem Monat, in dem du trainierst.',
  },
  news: {
    FR: 'Vous recevez ce message parce que vous avez demandé des nouvelles du projet.',
    EN: 'You get this because you asked for news about the project.',
    IT: 'Ricevi questo messaggio perché hai chiesto notizie sul progetto.',
    ES: 'Recibes este mensaje porque pediste noticias del proyecto.',
    PT_BR: 'Você recebe esta mensagem porque pediu notícias do projeto.',
    DE: 'Du erhältst diese Nachricht, weil du Neuigkeiten zum Projekt angefordert hast.',
  },
};

/** The website speaks the same languages, under these path prefixes */
export const WEBSITE_LOCALES: Record<EmailLanguage, string> = {
  FR: 'fr',
  EN: 'en',
  IT: 'it',
  ES: 'es',
  PT_BR: 'pt-br',
  DE: 'de',
};
