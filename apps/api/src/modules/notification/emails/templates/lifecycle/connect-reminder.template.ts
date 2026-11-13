import { button, heading, note, paragraph, signature } from '../../core/blocks';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: "Votre montre n'est pas encore reliée",
    preview: 'Une minute, et vos séances arrivent toutes seules.',
    body: "Votre compte est prêt, mais aucune montre n'y est encore reliée. Sans elle, votre calendrier et votre charge d'entraînement restent vides.",
    how: 'Ça prend une minute : Paramètres, Connecteurs, puis votre marque.',
    button: 'Relier ma montre',
    fallback:
      'Pas de montre compatible ? Vous pouvez importer vos fichiers FIT ou GPX, ou planifier vos séances à la main.',
  },
  EN: {
    subject: "Your watch isn't connected yet",
    preview: 'One minute, and your sessions arrive on their own.',
    body: 'Your account is ready, but no watch is connected to it yet. Without one, your calendar and training load stay empty.',
    how: 'It takes a minute: Settings, Connectors, then your brand.',
    button: 'Connect my watch',
    fallback:
      'No compatible watch? You can import FIT or GPX files, or plan your sessions by hand.',
  },
  IT: {
    subject: 'Il tuo orologio non è ancora collegato',
    preview: 'Un minuto, e le tue sessioni arrivano da sole.',
    body: 'Il tuo account è pronto, ma nessun orologio è ancora collegato. Senza, il calendario e il carico di allenamento restano vuoti.',
    how: 'Ci vuole un minuto: Impostazioni, Connettori, poi la tua marca.',
    button: 'Collega il mio orologio',
    fallback:
      'Nessun orologio compatibile? Puoi importare file FIT o GPX, oppure pianificare le sessioni a mano.',
  },
  ES: {
    subject: 'Tu reloj aún no está conectado',
    preview: 'Un minuto y tus sesiones llegan solas.',
    body: 'Tu cuenta está lista, pero todavía no hay ningún reloj conectado. Sin él, tu calendario y tu carga de entrenamiento siguen vacíos.',
    how: 'Se tarda un minuto: Ajustes, Conexiones y luego tu marca.',
    button: 'Conectar mi reloj',
    fallback:
      '¿No tienes un reloj compatible? Puedes importar archivos FIT o GPX, o planificar tus sesiones a mano.',
  },
  PT_BR: {
    subject: 'Seu relógio ainda não está conectado',
    preview: 'Um minuto, e seus treinos chegam sozinhos.',
    body: 'Sua conta está pronta, mas nenhum relógio está conectado ainda. Sem ele, seu calendário e sua carga de treino ficam vazios.',
    how: 'Leva um minuto: Configurações, Conectores e depois a sua marca.',
    button: 'Conectar meu relógio',
    fallback:
      'Não tem um relógio compatível? Você pode importar arquivos FIT ou GPX, ou planejar seus treinos à mão.',
  },
  DE: {
    subject: 'Deine Uhr ist noch nicht verbunden',
    preview: 'Eine Minute, und deine Aktivitäten kommen von selbst.',
    body: 'Dein Konto ist bereit, aber noch ist keine Uhr verbunden. Ohne sie bleiben dein Kalender und deine Trainingsbelastung leer.',
    how: 'Das dauert eine Minute: Einstellungen, Verbindungen, dann deine Marke.',
    button: 'Uhr verbinden',
    fallback:
      'Keine kompatible Uhr? Du kannst FIT- oder GPX-Dateien importieren oder deine Einheiten von Hand planen.',
  },
};

export function buildConnectReminderEmail(
  props: LifecycleEmailProps & { connectionsUrl: string },
): LifecycleEmail {
  const t = translations[props.language];
  return {
    subject: t.subject,
    ...renderEmail({
      language: props.language,
      title: t.subject,
      preview: t.preview,
      footer: props.footer,
      blocks: [
        heading(t.subject),
        paragraph(greeting(props.language, props.name)),
        paragraph(t.body),
        paragraph(t.how),
        button({ href: props.connectionsUrl, label: t.button }),
        note(t.fallback),
        signature(props.signature),
      ],
    }),
  };
}
