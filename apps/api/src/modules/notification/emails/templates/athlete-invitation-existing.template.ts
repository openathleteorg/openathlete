import { EmailLanguage } from '@openathlete/shared';

import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  FR: {
    title: 'Nouvelle invitation de coach',
    preview: (coachName: string) =>
      `${coachName} vous invite à rejoindre son équipe`,
    description: (coachName: string) =>
      `${coachName} vous invite à rejoindre son équipe d'athlètes sur OpenAthlete. Vous pouvez accepter ou refuser cette invitation dans vos paramètres.`,
    buttonLabel: 'Voir les invitations',
    linkNote: (url: string) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur: ${url}`,
    settingsNote:
      'Vous pouvez gérer toutes vos invitations dans la section Paramètres de votre compte.',
  },
  EN: {
    title: 'New coach invitation',
    preview: (coachName: string) =>
      `${coachName} invites you to join their team`,
    description: (coachName: string) =>
      `${coachName} invites you to join their team of athletes on OpenAthlete. You can accept or decline this invitation in your settings.`,
    buttonLabel: 'View invitations',
    linkNote: (url: string) =>
      `If the button doesn't work, copy and paste this link into your browser: ${url}`,
    settingsNote:
      'You can manage all your invitations in the Settings section of your account.',
  },
} as const;

export function buildAthleteInvitationExistingEmail({
  coachName,
  url,
  language = 'FR',
}: {
  coachName: string;
  url: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title;
  const preview = t.preview(coachName);

  const content = [
    h1(title),
    p(t.description(coachName)),
    button({ href: url, label: t.buttonLabel }),
    note(t.linkNote(url)),
    note(t.settingsNote),
  ].join('');

  return layout({ title, preview, contentHtml: content });
}
