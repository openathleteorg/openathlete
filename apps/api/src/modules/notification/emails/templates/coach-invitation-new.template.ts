import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph } from '../core/blocks';
import { renderEmail } from '../core/layout';

const translations = {
  ES: {
    title: 'Invitación para unirte a OpenAthlete',
    preview: (athleteName: string) =>
      `${athleteName} te invita a unirte a OpenAthlete`,
    description: (athleteName: string) =>
      `${athleteName} te invita a unirte a OpenAthlete como entrenador. Pulsa el botón para crear tu cuenta y empezar a hacer el seguimiento de los entrenamientos.`,
    buttonLabel: 'Crear mi cuenta',
    linkNote: (url: string) =>
      `Si el botón no funciona, copia y pega este enlace en tu navegador: ${url}`,
    expiryNote:
      'Esta invitación es válida durante 7 días. Si no te interesa, puedes ignorar este correo.',
  },
  FR: {
    title: 'Invitation à rejoindre OpenAthlete',
    preview: (athleteName: string) =>
      `${athleteName} vous invite à rejoindre OpenAthlete en tant que coach`,
    description: (athleteName: string) =>
      `${athleteName} vous invite à rejoindre OpenAthlete en tant que coach. Cliquez sur le bouton ci-dessous pour créer votre compte et commencer à suivre vos athlètes.`,
    buttonLabel: 'Créer mon compte',
    linkNote: (url: string) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur : ${url}`,
    expiryNote:
      "Cette invitation est valable pendant 7 jours. Si vous n'êtes pas intéressé, vous pouvez ignorer cet email.",
  },
  EN: {
    title: 'Invitation to join OpenAthlete',
    preview: (athleteName: string) =>
      `${athleteName} invites you to join OpenAthlete as a coach`,
    description: (athleteName: string) =>
      `${athleteName} invites you to join OpenAthlete as a coach. Click the button below to create your account and start tracking your athletes.`,
    buttonLabel: 'Create my account',
    linkNote: (url: string) =>
      `If the button doesn't work, copy and paste this link into your browser: ${url}`,
    expiryNote:
      'This invitation is valid for 7 days. If you are not interested, you can ignore this email.',
  },
  IT: {
    title: 'Invito a unirsi a OpenAthlete',
    preview: (athleteName: string) =>
      `${athleteName} ti invita a unirti a OpenAthlete come coach`,
    description: (athleteName: string) =>
      `${athleteName} ti invita a unirti a OpenAthlete come coach. Clicca sul pulsante qui sotto per creare il tuo account e iniziare a seguire i tuoi atleti.`,
    buttonLabel: 'Crea il mio account',
    linkNote: (url: string) =>
      `Se il pulsante non funziona, copia e incolla questo link nel tuo browser: ${url}`,
    expiryNote:
      'Questo invito è valido per 7 giorni. Se non sei interessato, puoi ignorare questa email.',
  },
  PT_BR: {
    title: 'Convite para entrar no OpenAthlete',
    preview: (athleteName: string) =>
      `${athleteName} convida você a entrar no OpenAthlete como treinador`,
    description: (athleteName: string) =>
      `${athleteName} convida você a entrar no OpenAthlete como treinador. Clique no botão abaixo para criar sua conta e começar a acompanhar seus atletas.`,
    buttonLabel: 'Criar minha conta',
    linkNote: (url: string) =>
      `Se o botão não funcionar, copie e cole este link no seu navegador: ${url}`,
    expiryNote:
      'Este convite é válido por 7 dias. Se não tiver interesse, você pode ignorar este e-mail.',
  },
} as const;

export function buildCoachInvitationNewEmail({
  athleteName,
  url,
  language = Language.FR,
}: {
  athleteName: string;
  url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview(athleteName);

  const blocks = [
    heading(title),
    paragraph(t.description(athleteName)),
    button({ href: url, label: t.buttonLabel }),
    note(t.linkNote(url)),
    note(t.expiryNote),
  ];

  return renderEmail({ language, title, preview, blocks });
}
