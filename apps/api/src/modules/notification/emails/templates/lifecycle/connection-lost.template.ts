import type { EmailLanguage } from '@openathlete/shared';

import { button, heading, note, paragraph, signature } from '../../core/blocks';
import { formatDay } from '../../core/format';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: (p: string) => `La synchro ${p} s'est arrêtée`,
    preview: "Vos nouvelles séances n'arrivent plus.",
    body: (p: string, since: string) =>
      `Depuis le ${since}, OpenAthlete ne reçoit plus vos séances ${p} : l'accès a été refusé ou retiré de votre compte ${p}.`,
    fix: 'Reconnectez-le pour reprendre. Les séances déjà importées restent là.',
    button: (p: string) => `Reconnecter ${p}`,
    ignore: "Si vous l'avez retiré volontairement, ignorez ce message.",
  },
  EN: {
    subject: (p: string) => `Your ${p} sync stopped`,
    preview: 'New sessions no longer come in.',
    body: (p: string, since: string) =>
      `Since ${since}, OpenAthlete no longer receives your ${p} sessions: access was refused or removed on your ${p} account.`,
    fix: 'Connect it again to pick up where it stopped. The sessions already imported stay where they are.',
    button: (p: string) => `Reconnect ${p}`,
    ignore: 'If you removed it on purpose, you can ignore this email.',
  },
  IT: {
    subject: (p: string) => `La sincronizzazione ${p} si è fermata`,
    preview: 'Le nuove sessioni non arrivano più.',
    body: (p: string, since: string) =>
      `Dal ${since} OpenAthlete non riceve più le tue sessioni ${p}: l’accesso è stato rifiutato o revocato dal tuo account ${p}.`,
    fix: 'Ricollegalo per ripartire. Le sessioni già importate restano dove sono.',
    button: (p: string) => `Ricollega ${p}`,
    ignore: 'Se l’hai rimosso di proposito, puoi ignorare questa email.',
  },
  ES: {
    subject: (p: string) => `La sincronización con ${p} se detuvo`,
    preview: 'Tus nuevas sesiones ya no llegan.',
    body: (p: string, since: string) =>
      `Desde el ${since}, OpenAthlete ya no recibe tus sesiones de ${p}: el acceso se rechazó o se retiró en tu cuenta de ${p}.`,
    fix: 'Vuelve a conectarlo para seguir. Las sesiones ya importadas se quedan donde están.',
    button: (p: string) => `Volver a conectar ${p}`,
    ignore: 'Si lo quitaste a propósito, puedes ignorar este correo.',
  },
  PT_BR: {
    subject: (p: string) => `A sincronização com o ${p} parou`,
    preview: 'Seus novos treinos não chegam mais.',
    body: (p: string, since: string) =>
      `Desde ${since}, o OpenAthlete não recebe mais seus treinos do ${p}: o acesso foi recusado ou removido na sua conta ${p}.`,
    fix: 'Conecte de novo para retomar. Os treinos já importados continuam onde estão.',
    button: (p: string) => `Reconectar ${p}`,
    ignore: 'Se você removeu de propósito, pode ignorar este e-mail.',
  },
} satisfies Record<EmailLanguage, unknown>;

export function buildConnectionLostEmail(
  props: LifecycleEmailProps & {
    provider: string;
    since: Date;
    connectionsUrl: string;
  },
): LifecycleEmail {
  const { language, provider } = props;
  const t = translations[language];
  const subject = t.subject(provider);
  return {
    subject,
    ...renderEmail({
      language,
      title: subject,
      preview: t.preview,
      footer: props.footer,
      blocks: [
        heading(subject),
        paragraph(greeting(language, props.name)),
        paragraph(t.body(provider, formatDay(language, props.since))),
        paragraph(t.fix),
        button({ href: props.connectionsUrl, label: t.button(provider) }),
        note(t.ignore),
        signature(props.signature),
      ],
    }),
  };
}
