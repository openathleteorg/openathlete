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
      'Como Supporter, tienes atletas ilimitados y la IA incluida cada mes, sin necesidad de clave propia.',
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
      "En tant que Supporter, vous coachez autant d'athlètes que vous voulez et l'IA est incluse chaque mois, sans clé à fournir.",
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
      'As a Supporter, you can coach as many athletes as you like, and AI is included every month, without a key of your own.',
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
      'Come Supporter, puoi allenare tutti gli atleti che vuoi e l’IA è inclusa ogni mese, senza una tua chiave.',
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
      'Como Supporter, você pode treinar quantos atletas quiser e a IA está incluída todos os meses, sem precisar de uma chave própria.',
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
      'Als Supporter kannst du so viele Athleten coachen, wie du möchtest, und KI ist jeden Monat inklusive, ganz ohne eigenen Schlüssel.',
    description:
      'Deine Unterstützung finanziert ein offenes und unabhängiges Projekt. Du kannst die Abrechnung jederzeit verwalten oder kündigen.',
    buttonLabel: 'Abo verwalten',
    helpNote:
      'Fragen? Antworte auf diese E-Mail, wir melden uns schnell bei dir.',
  },
} as const;

export function buildSubscriptionConfirmationEmail({
  name,
  subscription_settings_url,
  language = Language.FR,
}: {
  name?: string;
  subscription_settings_url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview;

  const blocks = [
    heading(title),
    paragraph(t.greeting(name)),
    paragraph(t.perks),
    paragraph(t.description),
    button({
      href: subscription_settings_url,
      label: t.buttonLabel,
    }),
    note(t.helpNote),
  ];

  return renderEmail({ language, title, preview, blocks });
}
