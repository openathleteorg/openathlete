import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

export function buildCoachInvitationNewEmail({
  athleteName,
  url,
}: {
  athleteName: string;
  url: string;
}) {
  const title = 'Invitation à rejoindre OpenAthlete';
  const preview = `${athleteName} vous invite à rejoindre OpenAthlete en tant que coach`;

  const content = [
    h1(title),
    p(
      `${athleteName} vous invite à rejoindre OpenAthlete en tant que coach. Cliquez sur le bouton ci-dessous pour créer votre compte et commencer à suivre vos athlètes.`,
    ),
    button({ href: url, label: 'Créer mon compte' }),
    note(
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur: ${url}`,
    ),
    note(
      "Cette invitation est valable pendant 7 jours. Si vous n'êtes pas intéressé, vous pouvez ignorer cet email.",
    ),
  ].join('');

  return layout({ title, preview, contentHtml: content });
}

