import {
  EmailLanguage,
  SubscriptionPlan,
  getPlanConfig,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const frPlanLabel: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: 'Gratuit',
  [SubscriptionPlan.ATHLETE_PRO]: 'Athlete Pro',
  [SubscriptionPlan.COACH_PRO]: 'Coach Pro',
  [SubscriptionPlan.COACH_ULTRA]: 'Coach Ultra',
  [SubscriptionPlan.CLUB_PRO]: 'Club Pro',
  [SubscriptionPlan.CLUB_ULTRA]: 'Club Ultra',
};

const itPlanLabel: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: 'Gratuito',
  [SubscriptionPlan.ATHLETE_PRO]: 'Athlete Pro',
  [SubscriptionPlan.COACH_PRO]: 'Coach Pro',
  [SubscriptionPlan.COACH_ULTRA]: 'Coach Ultra',
  [SubscriptionPlan.CLUB_PRO]: 'Club Pro',
  [SubscriptionPlan.CLUB_ULTRA]: 'Club Ultra',
};

function planLabel(plan: SubscriptionPlan, language: EmailLanguage): string {
  if (language === Language.EN) {
    return getPlanConfig(plan).name;
  }
  if (language === Language.ES) {
    return plan === SubscriptionPlan.FREE
      ? 'Gratuito'
      : getPlanConfig(plan).name;
  }
  if (language === Language.IT) {
    return itPlanLabel[plan];
  }
  return frPlanLabel[plan];
}

const translations = {
  ES: {
    title: 'Tu suscripción está confirmada',
    preview: 'Gracias por suscribirte',
    greeting: (name?: string) =>
      name
        ? `Hola, ${name}. Gracias por suscribirte a OpenAthlete.`
        : 'Gracias por suscribirte a OpenAthlete.',
    planLine: (label: string) => `Plan: ${label}.`,
    description:
      'Ya tienes acceso a todas las funciones de tu plan. Puedes gestionar la facturación, los métodos de pago y la suscripción en cualquier momento.',
    buttonLabel: 'Gestionar suscripción',
    helpNote:
      'Si tienes preguntas, responde a este correo y te contestaremos pronto.',
  },
  FR: {
    title: 'Votre abonnement est confirmé',
    preview: 'Merci pour votre confiance',
    greeting: (name?: string) =>
      name
        ? `Bonjour ${name}, votre souscription à OpenAthlete est bien enregistrée.`
        : 'Votre souscription à OpenAthlete est bien enregistrée.',
    planLine: (label: string) => `Formule souscrite : ${label}.`,
    description:
      'Vous avez désormais accès aux fonctionnalités incluses dans votre formule. Vous pouvez gérer votre facturation, vos moyens de paiement et votre abonnement à tout moment.',
    buttonLabel: 'Gérer mon abonnement',
    helpNote:
      'Une question ? Répondez simplement à cet email et nous vous répondrons rapidement.',
  },
  EN: {
    title: 'Your subscription is confirmed',
    preview: 'Thanks for subscribing',
    greeting: (name?: string) =>
      name
        ? `Hi ${name}, thank you for subscribing to OpenAthlete.`
        : 'Thank you for subscribing to OpenAthlete.',
    planLine: (label: string) => `Plan: ${label}.`,
    description:
      'You now have access to everything included in your plan. You can manage billing, payment methods, and your subscription at any time.',
    buttonLabel: 'Manage subscription',
    helpNote:
      'Questions? Reply to this email and we will get back to you shortly.',
  },
  IT: {
    title: 'Il tuo abbonamento è confermato',
    preview: 'Grazie per la tua fiducia',
    greeting: (name?: string) =>
      name
        ? `Ciao ${name}, la tua iscrizione a OpenAthlete è stata registrata correttamente.`
        : 'La tua iscrizione a OpenAthlete è stata registrata correttamente.',
    planLine: (label: string) => `Piano sottoscritto: ${label}.`,
    description:
      'Hai ora accesso a tutte le funzionalità incluse nel tuo piano. Puoi gestire la fatturazione, i metodi di pagamento e il tuo abbonamento in qualsiasi momento.',
    buttonLabel: 'Gestisci il mio abbonamento',
    helpNote:
      'Hai domande? Rispondi a questa email e ti risponderemo il prima possibile.',
  },
} as const;

export function buildSubscriptionConfirmationEmail({
  plan,
  name,
  subscription_settings_url,
  language = Language.FR,
}: {
  plan: SubscriptionPlan;
  name?: string;
  subscription_settings_url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const label = planLabel(plan, language);
  const title = t.title;
  const preview = t.preview;

  const content = [
    h1(title),
    p(t.greeting(name)),
    p(t.planLine(label)),
    p(t.description),
    button({
      href: subscription_settings_url,
      label: t.buttonLabel,
    }),
    note(t.helpNote),
  ].join('');

  return layout({ language, title, preview, contentHtml: content });
}
