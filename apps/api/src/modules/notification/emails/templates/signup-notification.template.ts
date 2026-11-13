import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { facts, heading, note, paragraph } from '../core/blocks';
import { renderEmail } from '../core/layout';

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
  PT_BR: {
    title: 'Novo cadastro de usuário',
    preview: 'Uma nova conta foi criada.',
    intro: (name?: string) =>
      name
        ? `${name} acabou de se cadastrar no OpenAthlete.`
        : 'Uma nova pessoa acabou de se cadastrar no OpenAthlete.',
    emailLabel: 'E-mail',
    nameLabel: 'Nome completo',
    followUp:
      'Fique à vontade para entrar em contato, dar as boas-vindas e entender as necessidades dessa pessoa.',
    note: 'Este e-mail é enviado automaticamente a cada novo cadastro.',
  },
  DE: {
    title: 'Neue Registrierung',
    preview: 'Gerade hat jemand ein Konto erstellt.',
    intro: (name?: string) =>
      name
        ? `${name} hat sich gerade bei OpenAthlete registriert.`
        : 'Gerade hat sich jemand bei OpenAthlete registriert.',
    emailLabel: 'E-Mail',
    nameLabel: 'Vollständiger Name',
    followUp:
      'Melde dich gern, um die Person willkommen zu heißen oder ihre Bedürfnisse zu erfahren.',
    note: 'Diese E-Mail wird bei jeder neuen Registrierung automatisch versendet.',
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

  return renderEmail({
    language,
    title: t.title,
    preview: t.preview,
    blocks: [
      heading(t.title),
      paragraph(t.intro(fullName)),
      facts([
        { label: t.emailLabel, value: email },
        ...(fullName ? [{ label: t.nameLabel, value: fullName }] : []),
      ]),
      paragraph(t.followUp),
      note(t.note),
    ],
  });
}
