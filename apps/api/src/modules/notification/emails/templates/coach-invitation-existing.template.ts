import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  ES: {
    title: 'Nueva invitación de entrenador',
    preview: (athleteName: string) =>
      `${athleteName} te invita a ser su entrenador`,
    description: (athleteName: string) =>
      `${athleteName} te invita a ser su entrenador en OpenAthlete. Puedes aceptar o rechazar la invitación en los ajustes.`,
    buttonLabel: 'Ver invitaciones',
    linkNote: (url: string) =>
      `Si el botón no funciona, copia y pega este enlace en tu navegador: ${url}`,
    settingsNote:
      'Puedes gestionar todas tus invitaciones en la sección Ajustes de tu cuenta.',
  },
  FR: {
    title: 'Nouvelle invitation de coach',
    preview: (athleteName: string) =>
      `${athleteName} vous invite à devenir son coach`,
    description: (athleteName: string) =>
      `${athleteName} vous invite à devenir son coach sur OpenAthlete. Vous pouvez accepter ou refuser cette invitation dans vos paramètres.`,
    buttonLabel: 'Voir les invitations',
    linkNote: (url: string) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur: ${url}`,
    settingsNote:
      'Vous pouvez gérer toutes vos invitations dans la section Paramètres de votre compte.',
  },
  EN: {
    title: 'New coach invitation',
    preview: (athleteName: string) =>
      `${athleteName} invites you to become their coach`,
    description: (athleteName: string) =>
      `${athleteName} invites you to become their coach on OpenAthlete. You can accept or decline this invitation in your settings.`,
    buttonLabel: 'View invitations',
    linkNote: (url: string) =>
      `If the button doesn't work, copy and paste this link into your browser: ${url}`,
    settingsNote:
      'You can manage all your invitations in the Settings section of your account.',
  },
  IT: {
    title: 'Nuovo invito come coach',
    preview: (athleteName: string) =>
      `${athleteName} ti invita a diventare il suo coach`,
    description: (athleteName: string) =>
      `${athleteName} ti invita a diventare il suo coach su OpenAthlete. Puoi accettare o rifiutare questo invito nelle tue impostazioni.`,
    buttonLabel: 'Visualizza gli inviti',
    linkNote: (url: string) =>
      `Se il pulsante non funziona, copia e incolla questo link nel tuo browser: ${url}`,
    settingsNote:
      'Puoi gestire tutti i tuoi inviti nella sezione Impostazioni del tuo account.',
  },
} as const;

export function buildCoachInvitationExistingEmail({
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

  const content = [
    h1(title),
    p(t.description(athleteName)),
    button({ href: url, label: t.buttonLabel }),
    note(t.linkNote(url)),
    note(t.settingsNote),
  ].join('');

  return layout({ language, title, preview, contentHtml: content });
}
