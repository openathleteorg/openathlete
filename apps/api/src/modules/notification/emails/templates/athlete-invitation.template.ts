import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

export function buildAthleteInvitationEmail({
  coachName,
  url,
}: {
  coachName: string;
  url: string;
}) {
  const title = 'Invitation à rejoindre OpenAthlete';
  const preview = `${coachName} vous invite à rejoindre OpenAthlete`;

  const content = [
    h1(title),
    p(
      `${coachName} vous invite à rejoindre OpenAthlete en tant qu'athlète. Cliquez sur le bouton ci-dessous pour créer votre compte et commencer à suivre vos entraînements.`,
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
