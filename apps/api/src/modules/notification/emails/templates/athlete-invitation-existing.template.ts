import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

export function buildAthleteInvitationExistingEmail({
  coachName,
  url,
}: {
  coachName: string;
  url: string;
}) {
  const title = 'Nouvelle invitation de coach';
  const preview = `${coachName} vous invite à rejoindre son équipe`;

  const content = [
    h1(title),
    p(
      `${coachName} vous invite à rejoindre son équipe d'athlètes sur OpenAthlete. Vous pouvez accepter ou refuser cette invitation dans vos paramètres.`,
    ),
    button({ href: url, label: 'Voir les invitations' }),
    note(
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur: ${url}`,
    ),
    note(
      'Vous pouvez gérer toutes vos invitations dans la section Paramètres de votre compte.',
    ),
  ].join('');

  return layout({ title, preview, contentHtml: content });
}
