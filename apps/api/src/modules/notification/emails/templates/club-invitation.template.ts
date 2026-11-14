import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph } from '../core/blocks';
import { renderEmail } from '../core/layout';

type Role = 'ATHLETE' | 'COACH';

const translations: Record<
  EmailLanguage,
  {
    title: (club: string) => string;
    preview: (inviter: string, club: string) => string;
    description: (inviter: string, club: string, role: Role) => string;
    buttonLabel: string;
    linkNote: (url: string) => string;
    ignoreNote: string;
  }
> = {
  ES: {
    title: (club) => `Únete a ${club}`,
    preview: (inviter, club) =>
      `${inviter} te invita a unirte a ${club} en OpenAthlete`,
    description: (inviter, club, role) =>
      role === 'COACH'
        ? `${inviter} te invita a entrenar a los atletas de ${club} en OpenAthlete. Pulsa el botón para crear tu cuenta o iniciar sesión, y unirte al club.`
        : `${inviter} te invita a unirte a ${club} en OpenAthlete. Sus entrenadores verán tus entrenamientos y planificarán tus sesiones. Pulsa el botón para crear tu cuenta o iniciar sesión.`,
    buttonLabel: 'Unirme al club',
    linkNote: (url) =>
      `Si el botón no funciona, copia y pega este enlace en tu navegador: ${url}`,
    ignoreNote: 'Si no esperabas esta invitación, puedes ignorar este correo.',
  },
  FR: {
    title: (club) => `Rejoignez ${club}`,
    preview: (inviter, club) =>
      `${inviter} vous invite à rejoindre ${club} sur OpenAthlete`,
    description: (inviter, club, role) =>
      role === 'COACH'
        ? `${inviter} vous invite à entraîner les athlètes de ${club} sur OpenAthlete. Cliquez sur le bouton pour créer votre compte ou vous connecter, et rejoindre le club.`
        : `${inviter} vous invite à rejoindre ${club} sur OpenAthlete. Ses entraîneurs verront vos entraînements et planifieront vos séances. Cliquez sur le bouton pour créer votre compte ou vous connecter.`,
    buttonLabel: 'Rejoindre le club',
    linkNote: (url) =>
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur : ${url}`,
    ignoreNote:
      "Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.",
  },
  EN: {
    title: (club) => `Join ${club}`,
    preview: (inviter, club) =>
      `${inviter} invites you to join ${club} on OpenAthlete`,
    description: (inviter, club, role) =>
      role === 'COACH'
        ? `${inviter} invites you to coach the athletes of ${club} on OpenAthlete. Click the button to create your account or log in, and join the club.`
        : `${inviter} invites you to join ${club} on OpenAthlete. Its coaches will see your training and plan your sessions. Click the button to create your account or log in.`,
    buttonLabel: 'Join the club',
    linkNote: (url) =>
      `If the button doesn't work, copy and paste this link into your browser: ${url}`,
    ignoreNote:
      'If you were not expecting this invitation, you can ignore this email.',
  },
  IT: {
    title: (club) => `Entra in ${club}`,
    preview: (inviter, club) =>
      `${inviter} ti invita a entrare in ${club} su OpenAthlete`,
    description: (inviter, club, role) =>
      role === 'COACH'
        ? `${inviter} ti invita ad allenare gli atleti di ${club} su OpenAthlete. Clicca sul pulsante per creare il tuo account o accedere, ed entrare nel club.`
        : `${inviter} ti invita a entrare in ${club} su OpenAthlete. I suoi allenatori vedranno i tuoi allenamenti e pianificheranno le tue sessioni. Clicca sul pulsante per creare il tuo account o accedere.`,
    buttonLabel: 'Entra nel club',
    linkNote: (url) =>
      `Se il pulsante non funziona, copia e incolla questo link nel tuo browser: ${url}`,
    ignoreNote:
      'Se non ti aspettavi questo invito, puoi ignorare questa email.',
  },
  PT_BR: {
    title: (club) => `Entre no ${club}`,
    preview: (inviter, club) =>
      `${inviter} convida você a entrar no ${club} no OpenAthlete`,
    description: (inviter, club, role) =>
      role === 'COACH'
        ? `${inviter} convida você a treinar os atletas do ${club} no OpenAthlete. Clique no botão para criar sua conta ou entrar, e fazer parte do clube.`
        : `${inviter} convida você a entrar no ${club} no OpenAthlete. Os treinadores verão seus treinos e planejarão suas sessões. Clique no botão para criar sua conta ou entrar.`,
    buttonLabel: 'Entrar no clube',
    linkNote: (url) =>
      `Se o botão não funcionar, copie e cole este link no seu navegador: ${url}`,
    ignoreNote: 'Se você não esperava este convite, pode ignorar este e-mail.',
  },
  DE: {
    title: (club) => `Tritt ${club} bei`,
    preview: (inviter, club) =>
      `${inviter} lädt dich zu ${club} auf OpenAthlete ein`,
    description: (inviter, club, role) =>
      role === 'COACH'
        ? `${inviter} lädt dich ein, die Athleten von ${club} auf OpenAthlete zu trainieren. Klicke auf den Button, um dein Konto zu erstellen oder dich anzumelden, und tritt dem Verein bei.`
        : `${inviter} lädt dich zu ${club} auf OpenAthlete ein. Die Trainer des Vereins sehen dein Training und planen deine Einheiten. Klicke auf den Button, um dein Konto zu erstellen oder dich anzumelden.`,
    buttonLabel: 'Dem Verein beitreten',
    linkNote: (url) =>
      `Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser: ${url}`,
    ignoreNote:
      'Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.',
  },
};

export function buildClubInvitationEmail({
  clubName,
  inviterName,
  url,
  role,
  language = Language.FR,
}: {
  clubName: string;
  inviterName: string;
  url: string;
  role: Role;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const title = t.title(clubName);
  return renderEmail({
    language,
    title,
    preview: t.preview(inviterName, clubName),
    blocks: [
      heading(title),
      paragraph(t.description(inviterName, clubName, role)),
      button({ href: url, label: t.buttonLabel }),
      note(t.linkNote(url)),
      note(t.ignoreNote),
    ],
  });
}
