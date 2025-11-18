import { EmailLanguage } from '@openathlete/shared';

import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  FR: {
    title: 'Bienvenue sur OpenAthlete',
    preview: (name?: string) =>
      name ? `Bienvenue, ${name} !` : 'Bienvenue sur OpenAthlete',
    greeting: (name?: string) =>
      name
        ? `Ravi de vous compter parmi nous, ${name}.`
        : 'Ravi de vous compter parmi nous.',
    description:
      'Vous pouvez dès maintenant configurer vos objectifs, importer vos séances et explorer votre tableau de bord.',
    buttonLabel: 'Accéder au tableau de bord',
    helpNote:
      "Besoin d'aide ? Répondez simplement à cet email et nous vous aiderons rapidement.",
  },
  EN: {
    title: 'Welcome to OpenAthlete',
    preview: (name?: string) =>
      name ? `Welcome, ${name}!` : 'Welcome to OpenAthlete',
    greeting: (name?: string) =>
      name
        ? `We're thrilled to have you with us, ${name}.`
        : "We're thrilled to have you with us.",
    description:
      'You can now configure your goals, import your sessions, and explore your dashboard.',
    buttonLabel: 'Access dashboard',
    helpNote:
      'Need help? Simply reply to this email and we will help you quickly.',
  },
} as const;

export function buildWelcomeEmail({
  name,
  dashboard_url,
  language = 'FR',
}: {
  name?: string;
  dashboard_url?: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview(name);

  const content = [
    h1(title),
    p(t.greeting(name)),
    p(t.description),
    dashboard_url ? button({ href: dashboard_url, label: t.buttonLabel }) : '',
    note(t.helpNote),
  ]
    .filter(Boolean)
    .join('');

  return layout({ title, preview, contentHtml: content });
}
