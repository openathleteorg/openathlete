import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  ES: {
    title: 'Nuevo registro de usuario',
    preview: 'Se acaba de crear una nueva cuenta.',
    intro: (name?: string) =>
      name
        ? `${name} se ha registrado en OpenAthlete.`
        : 'Una nueva persona se ha registrado en OpenAthlete.',
    emailLabel: 'Correo electrónico',
    nameLabel: 'Nombre completo',
    followUp:
      'Puedes contactar para darle la bienvenida o conocer sus necesidades.',
    note: 'Este correo se envía automáticamente con cada nuevo registro.',
  },
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
  IT: {
    title: 'Nuova registrazione utente',
    preview: 'Un nuovo utente ha appena creato un account.',
    intro: (name?: string) =>
      name
        ? `${name} si è appena iscritto a OpenAthlete.`
        : 'Un nuovo utente si è appena iscritto a OpenAthlete.',
    emailLabel: 'Email',
    nameLabel: 'Nome completo',
    followUp:
      'Puoi contattare questo utente per dargli il benvenuto o verificare le sue esigenze.',
    note: 'Questa email viene inviata automaticamente ad ogni nuova registrazione.',
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
    language,
    title: t.title,
    preview: t.preview,
    contentHtml: content,
  });
}
