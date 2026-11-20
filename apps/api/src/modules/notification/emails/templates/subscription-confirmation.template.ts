import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph } from '../core/blocks';
import { renderEmail } from '../core/layout';

const translations = {
  ES: {
    title: 'Gracias por apoyar OpenAthlete',
    preview: 'Ya eres Supporter',
    greeting: (name?: string) =>
      name
        ? `Hola, ${name}. Gracias por apoyar OpenAthlete.`
        : 'Gracias por apoyar OpenAthlete.',
    perks:
      'Como Supporter, tienes atletas ilimitados y la IA incluida cada semana, en un uso razonable, sin necesidad de clave propia.',
    contribution: (price: string, yearly: boolean) =>
      `Tu apoyo: ${price} ${yearly ? 'al año' : 'al mes'}.`,
    description:
      'Tu apoyo financia el desarrollo de un proyecto abierto e independiente. Puedes gestionar la facturación o cancelar en cualquier momento.',
    buttonLabel: 'Gestionar suscripción',
    helpNote:
      'Si tienes preguntas, responde a este correo y te contestaremos pronto.',
  },
  FR: {
    title: 'Merci de soutenir OpenAthlete',
    preview: 'Vous êtes Supporter',
    greeting: (name?: string) =>
      name
        ? `Bonjour ${name}, merci de soutenir OpenAthlete.`
        : 'Merci de soutenir OpenAthlete.',
    perks:
      "En tant que Supporter, vous coachez autant d'athlètes que vous voulez et l'IA est incluse chaque semaine, dans un usage raisonnable, sans clé à fournir.",
    contribution: (price: string, yearly: boolean) =>
      `Votre soutien : ${price} ${yearly ? 'par an' : 'par mois'}.`,
    description:
      'Votre soutien finance le développement d’un projet ouvert et indépendant. Vous pouvez gérer votre facturation ou résilier à tout moment.',
    buttonLabel: 'Gérer mon abonnement',
    helpNote:
      'Une question ? Répondez simplement à cet email et nous vous répondrons rapidement.',
  },
  EN: {
    title: 'Thank you for supporting OpenAthlete',
    preview: 'You are now a Supporter',
    greeting: (name?: string) =>
      name
        ? `Hi ${name}, thank you for supporting OpenAthlete.`
        : 'Thank you for supporting OpenAthlete.',
    perks:
      'As a Supporter, you can coach as many athletes as you like, and AI is included every week, for reasonable use, without a key of your own.',
    contribution: (price: string, yearly: boolean) =>
      `Your support: ${price} ${yearly ? 'a year' : 'a month'}.`,
    description:
      'Your support funds an open and independent project. You can manage billing or cancel at any time.',
    buttonLabel: 'Manage subscription',
    helpNote:
      'Questions? Reply to this email and we will get back to you shortly.',
  },
  IT: {
    title: 'Grazie per sostenere OpenAthlete',
    preview: 'Ora sei Supporter',
    greeting: (name?: string) =>
      name
        ? `Ciao ${name}, grazie per sostenere OpenAthlete.`
        : 'Grazie per sostenere OpenAthlete.',
    perks:
      'Come Supporter, puoi allenare tutti gli atleti che vuoi e l’IA è inclusa ogni settimana, per un uso ragionevole, senza una tua chiave.',
    contribution: (price: string, yearly: boolean) =>
      `Il tuo sostegno: ${price} ${yearly ? 'all’anno' : 'al mese'}.`,
    description:
      'Il tuo sostegno finanzia lo sviluppo di un progetto aperto e indipendente. Puoi gestire la fatturazione o disdire in qualsiasi momento.',
    buttonLabel: 'Gestisci il mio abbonamento',
    helpNote:
      'Hai domande? Rispondi a questa email e ti risponderemo il prima possibile.',
  },
  PT_BR: {
    title: 'Agradecemos por apoiar o OpenAthlete',
    preview: 'Agora você é Supporter',
    greeting: (name?: string) =>
      name
        ? `Olá, ${name}. Agradecemos por apoiar o OpenAthlete.`
        : 'Agradecemos por apoiar o OpenAthlete.',
    perks:
      'Como Supporter, você pode treinar quantos atletas quiser e a IA está incluída toda semana, para um uso razoável, sem precisar de uma chave própria.',
    contribution: (price: string, yearly: boolean) =>
      `Seu apoio: ${price} ${yearly ? 'por ano' : 'por mês'}.`,
    description:
      'Seu apoio financia o desenvolvimento de um projeto aberto e independente. Você pode gerenciar a cobrança ou cancelar a qualquer momento.',
    buttonLabel: 'Gerenciar assinatura',
    helpNote:
      'Tem dúvidas? Responda a este e-mail e entraremos em contato em breve.',
  },
  DE: {
    title: 'Danke, dass du OpenAthlete unterstützt',
    preview: 'Du bist jetzt Supporter',
    greeting: (name?: string) =>
      name
        ? `Hallo ${name}, danke, dass du OpenAthlete unterstützt.`
        : 'Danke, dass du OpenAthlete unterstützt.',
    perks:
      'Als Supporter kannst du so viele Athleten coachen, wie du möchtest, und KI ist jede Woche im Rahmen einer angemessenen Nutzung inklusive, ganz ohne eigenen Schlüssel.',
    contribution: (price: string, yearly: boolean) =>
      `Deine Unterstützung: ${price} ${yearly ? 'pro Jahr' : 'pro Monat'}.`,
    description:
      'Deine Unterstützung finanziert ein offenes und unabhängiges Projekt. Du kannst die Abrechnung jederzeit verwalten oder kündigen.',
    buttonLabel: 'Abo verwalten',
    helpNote:
      'Fragen? Antworte auf diese E-Mail, wir melden uns schnell bei dir.',
  },
  PL: {
    title: 'Dziękujemy, że wspierasz OpenAthlete',
    preview: 'Jesteś teraz Supporterem',
    greeting: (name?: string) =>
      name
        ? `Cześć ${name}, dziękujemy, że wspierasz OpenAthlete.`
        : 'Dziękujemy, że wspierasz OpenAthlete.',
    perks:
      'Jako Supporter możesz trenować dowolną liczbę zawodników, a AI jest wliczone co tydzień, w rozsądnym zakresie, bez własnego klucza.',
    contribution: (price: string, yearly: boolean) =>
      `Twoje wsparcie: ${price} ${yearly ? 'rocznie' : 'miesięcznie'}.`,
    description:
      'Twoje wsparcie finansuje otwarty i niezależny projekt. W każdej chwili możesz zarządzać płatnościami lub zrezygnować.',
    buttonLabel: 'Zarządzaj subskrypcją',
    helpNote:
      'Masz pytania? Odpowiedz na tego e-maila, a szybko się odezwiemy.',
  },
  NL: {
    title: 'Bedankt dat je OpenAthlete steunt',
    preview: 'Je bent nu Supporter',
    greeting: (name?: string) =>
      name
        ? `Hoi ${name}, bedankt dat je OpenAthlete steunt.`
        : 'Bedankt dat je OpenAthlete steunt.',
    perks:
      'Als Supporter coach je zoveel atleten als je wilt, en AI is elke week inbegrepen, bij redelijk gebruik, zonder eigen sleutel.',
    contribution: (price: string, yearly: boolean) =>
      `Je steun: ${price} ${yearly ? 'per jaar' : 'per maand'}.`,
    description:
      'Met je steun financier je een open en onafhankelijk project. Je kunt je betaling op elk moment beheren of opzeggen.',
    buttonLabel: 'Abonnement beheren',
    helpNote:
      'Vragen? Beantwoord deze e-mail en we nemen snel contact met je op.',
  },
} as const;

const LOCALES: Record<EmailLanguage, string> = {
  ES: 'es',
  FR: 'fr',
  EN: 'en',
  IT: 'it',
  PT_BR: 'pt-BR',
  DE: 'de',
  PL: 'pl',
  NL: 'nl',
};

export function buildSubscriptionConfirmationEmail({
  name,
  subscription_settings_url,
  amount_cents,
  interval,
  language = Language.FR,
}: {
  name?: string;
  subscription_settings_url: string;
  /** Price of the tier, in euro cents */
  amount_cents?: number;
  interval?: 'month' | 'year';
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const price =
    amount_cents !== undefined
      ? new Intl.NumberFormat(LOCALES[language], {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: amount_cents % 100 ? 2 : 0,
        }).format(amount_cents / 100)
      : null;
  const title = t.title;
  const preview = t.preview;

  const blocks = [
    heading(title),
    paragraph(t.greeting(name)),
    paragraph(t.perks),
    ...(price && interval
      ? [paragraph(t.contribution(price, interval === 'year'))]
      : []),
    paragraph(t.description),
    button({
      href: subscription_settings_url,
      label: t.buttonLabel,
    }),
    note(t.helpNote),
  ];

  return renderEmail({ language, title, preview, blocks });
}
