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
  DE: {
    title: 'Einladung zu OpenAthlete',
    preview: (coachName: string) => `${coachName} lädt dich zu OpenAthlete ein`,
    description: (coachName: string) =>
      `${coachName} lädt dich als Athlet zu OpenAthlete ein. Klicke auf den Button unten, um dein Konto zu erstellen und deine Trainings zu verfolgen.`,
    buttonLabel: 'Konto erstellen',
    linkNote: (url: string) =>
      `Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser: ${url}`,
    expiryNote:
      'Diese Einladung ist 7 Tage gültig. Wenn du kein Interesse hast, kannst du diese E-Mail ignorieren.',
  },
  PL: {
    title: 'Zaproszenie do OpenAthlete',
    preview: (coachName: string) => `${coachName} zaprasza Cię do OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} zaprasza Cię do OpenAthlete jako zawodnika. Kliknij przycisk poniżej, aby założyć konto i zacząć śledzić swoje treningi.`,
    buttonLabel: 'Załóż konto',
    linkNote: (url: string) =>
      `Jeśli przycisk nie działa, skopiuj ten link i wklej go w przeglądarce: ${url}`,
    expiryNote:
      'To zaproszenie jest ważne przez 7 dni. Jeśli Cię nie interesuje, możesz zignorować tę wiadomość.',
  },
  NL: {
    title: 'Uitnodiging voor OpenAthlete',
    preview: (coachName: string) =>
      `${coachName} nodigt je uit voor OpenAthlete`,
    description: (coachName: string) =>
      `${coachName} nodigt je uit om als atleet lid te worden van OpenAthlete. Klik op de knop hieronder om je account aan te maken en je trainingen bij te houden.`,
    buttonLabel: 'Account aanmaken',
    linkNote: (url: string) =>
      `Werkt de knop niet? Kopieer deze link en plak hem in je browser: ${url}`,
    expiryNote:
      'Deze uitnodiging is 7 dagen geldig. Heb je geen interesse, dan kun je deze e-mail negeren.',
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
