import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph } from '../core/blocks';
import { renderEmail } from '../core/layout';

const translations = {
  ES: {
    title: 'Invitación para unirte a OpenAthlete',
    preview: (coachName: string) =>
      `${coachName} te invita a unirte a OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} te invita a unirte a OpenAthlete como atleta. Pulsa el botón para crear tu cuenta y empezar a hacer el seguimiento de los entrenamientos.`,
    buttonLabel: 'Crear mi cuenta',
    linkNote: (url: string) =>
      `Si el botón no funciona, copia y pega este enlace en tu navegador: ${url}`,
    expiryNote:
      'Esta invitación es válida durante 7 días. Si no te interesa, puedes ignorar este correo.',
  },
  FR: {
    title: 'Invitation à rejoindre OpenAthlete',
    preview: (coachName: string) =>
      `${coachName} vous invite à rejoindre OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} vous invite à rejoindre OpenAthlete en tant qu'athlète. Cliquez sur le bouton ci-dessous pour créer votre compte et commencer à suivre vos entraînements.`,
    buttonLabel: 'Créer mon compte',
    linkNote: (url: string) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur : ${url}`,
    expiryNote:
      "Cette invitation est valable pendant 7 jours. Si vous n'êtes pas intéressé, vous pouvez ignorer cet email.",
  },
  EN: {
    title: 'Invitation to join OpenAthlete',
    preview: (coachName: string) =>
      `${coachName} invites you to join OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} invites you to join OpenAthlete as an athlete. Click the button below to create your account and start tracking your workouts.`,
    buttonLabel: 'Create my account',
    linkNote: (url: string) =>
      `If the button doesn't work, copy and paste this link into your browser: ${url}`,
    expiryNote:
      'This invitation is valid for 7 days. If you are not interested, you can ignore this email.',
  },
  IT: {
    title: 'Invito a unirsi a OpenAthlete',
    preview: (coachName: string) =>
      `${coachName} ti invita a unirti a OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} ti invita a unirti a OpenAthlete come atleta. Clicca sul pulsante qui sotto per creare il tuo account e iniziare a monitorare i tuoi allenamenti.`,
    buttonLabel: 'Crea il mio account',
    linkNote: (url: string) =>
      `Se il pulsante non funziona, copia e incolla questo link nel tuo browser: ${url}`,
    expiryNote:
      'Questo invito è valido per 7 giorni. Se non sei interessato, puoi ignorare questa email.',
  },
  PT_BR: {
    title: 'Convite para entrar no OpenAthlete',
    preview: (coachName: string) =>
      `${coachName} convida você a entrar no OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} convida você a entrar no OpenAthlete como atleta. Clique no botão abaixo para criar sua conta e começar a acompanhar seus treinos.`,
    buttonLabel: 'Criar minha conta',
    linkNote: (url: string) =>
      `Se o botão não funcionar, copie e cole este link no seu navegador: ${url}`,
    expiryNote:
      'Este convite é válido por 7 dias. Se não tiver interesse, você pode ignorar este e-mail.',
  },
} as const;

export function buildAthleteInvitationEmail({
  coachName,
  url,
  language = Language.FR,
}: {
  coachName: string;
  url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview(coachName);

  const blocks = [
    heading(title),
    paragraph(t.description(coachName)),
    button({ href: url, label: t.buttonLabel }),
    note(t.linkNote(url)),
    note(t.expiryNote),
  ];

  return renderEmail({ language, title, preview, blocks });
}
