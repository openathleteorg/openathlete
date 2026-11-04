import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph } from '../core/blocks';
import { renderEmail } from '../core/layout';

const translations = {
  ES: {
    title: 'Restablece tu contraseña',
    preview: 'Restablece tu contraseña de OpenAthlete',
    description:
      'Hemos recibido una solicitud para restablecer tu contraseña. Pulsa el botón para crear una nueva.',
    buttonLabel: 'Elegir una nueva contraseña',
    linkNote: (url: string) =>
      `Si el botón no funciona, copia y pega este enlace en tu navegador: ${url}`,
    ignoreNote:
      'Si no has realizado esta solicitud, puedes ignorar este correo.',
  },
  FR: {
    title: 'Réinitialiser votre mot de passe',
    preview: 'Réinitialisez votre mot de passe OpenAthlete',
    description:
      'Nous avons reçu une demande pour réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.',
    buttonLabel: 'Choisir un nouveau mot de passe',
    linkNote: (url: string) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur : ${url}`,
    ignoreNote:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
  },
  EN: {
    title: 'Reset your password',
    preview: 'Reset your OpenAthlete password',
    description:
      'We received a request to reset your password. Click the button below to create a new password.',
    buttonLabel: 'Choose a new password',
    linkNote: (url: string) =>
      `If the button doesn't work, copy and paste this link into your browser: ${url}`,
    ignoreNote: "If you didn't make this request, you can ignore this email.",
  },
  IT: {
    title: 'Reimposta la tua password',
    preview: 'Reimposta la tua password di OpenAthlete',
    description:
      'Abbiamo ricevuto una richiesta di reimpostazione della tua password. Clicca sul pulsante qui sotto per crearne una nuova.',
    buttonLabel: 'Scegli una nuova password',
    linkNote: (url: string) =>
      `Se il pulsante non funziona, copia e incolla questo link nel tuo browser: ${url}`,
    ignoreNote:
      'Se non hai effettuato questa richiesta, puoi ignorare questa email.',
  },
  PT_BR: {
    title: 'Redefina sua senha',
    preview: 'Redefina sua senha do OpenAthlete',
    description:
      'Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.',
    buttonLabel: 'Escolher uma nova senha',
    linkNote: (url: string) =>
      `Se o botão não funcionar, copie e cole este link no seu navegador: ${url}`,
    ignoreNote: 'Se você não fez esta solicitação, pode ignorar este e-mail.',
  },
} as const;

export function buildPasswordResetEmail({
  url,
  language = Language.FR,
}: {
  url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview;

  const blocks = [
    heading(title),
    paragraph(t.description),
    button({ href: url, label: t.buttonLabel }),
    note(t.linkNote(url)),
    note(t.ignoreNote),
  ];

  return renderEmail({ language, title, preview, blocks });
}
