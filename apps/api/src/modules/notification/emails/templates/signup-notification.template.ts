import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  FR: {
    title: 'Nouvelle inscription utilisateur',
    preview: 'Un nouvel utilisateur vient de créer un compte.',
    intro: (name?: string) =>
      name
        ? `${name} vient de s'inscrire sur OpenAthlete.`
        : 'Un nouvel utilisateur vient de s’inscrire sur OpenAthlete.',
    emailLabel: 'Email',
    nameLabel: 'Nom complet',
    followUp:
      'Vous pouvez contacter cet utilisateur pour lui souhaiter la bienvenue ou vérifier ses besoins.',
    note: 'Cet email est envoyé automatiquement à chaque nouvelle inscription.',
  },
  EN: {
    title: 'New user signup',
    preview: 'A new user just created an account.',
    intro: (name?: string) =>
      name
        ? `${name} just signed up for OpenAthlete.`
        : 'A new user just signed up for OpenAthlete.',
    emailLabel: 'Email',
    nameLabel: 'Full name',
    followUp:
      'Feel free to reach out to welcome them onboard or capture their needs.',
    note: 'This email is sent automatically for every new signup.',
  },
} as const;

export function buildSignupNotificationEmail({
  email,
  firstName,
  lastName,
  language = Language.FR,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

  const content = [
    h1(t.title),
    p(t.intro(fullName)),
    p(`<strong>${t.emailLabel}:</strong> ${email}`),
    fullName ? p(`<strong>${t.nameLabel}:</strong> ${fullName}`) : '',
    p(t.followUp),
    note(t.note),
  ]
    .filter(Boolean)
    .join('');

  return layout({
    title: t.title,
    preview: t.preview,
    contentHtml: content,
  });
}
