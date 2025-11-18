import { EmailLanguage } from '@openathlete/shared';

import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  FR: {
    title: 'Invitation à rejoindre OpenAthlete',
    preview: (athleteName: string) =>
      `${athleteName} vous invite à rejoindre OpenAthlete en tant que coach`,
    description: (athleteName: string) =>
      `${athleteName} vous invite à rejoindre OpenAthlete en tant que coach. Cliquez sur le bouton ci-dessous pour créer votre compte et commencer à suivre vos athlètes.`,
    buttonLabel: 'Créer mon compte',
    linkNote: (url: string) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur: ${url}`,
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
} as const;

export function buildCoachInvitationNewEmail({
  athleteName,
  url,
  language = 'FR',
}: {
  athleteName: string;
  url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview(athleteName);

  const content = [
    h1(title),
    p(t.description(athleteName)),
    button({ href: url, label: t.buttonLabel }),
    note(t.linkNote(url)),
    note(t.expiryNote),
  ].join('');

  return layout({ title, preview, contentHtml: content });
}
