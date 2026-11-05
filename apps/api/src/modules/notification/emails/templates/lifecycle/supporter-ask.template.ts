import { type EmailLanguage, SUPPORTER_GOAL } from '@openathlete/shared';

import { paragraph, signature } from '../../core/blocks';
import { formatNumber } from '../../core/format';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

// A letter, asked once: no layout, no pressure, true figures only
const translations = {
  FR: {
    subject: 'une demande, une seule fois',
    preview: "OpenAthlete n'a ni investisseur ni publicité.",
    since: (weeks: string, sessions: string) =>
      `Vos séances arrivent sur OpenAthlete depuis ${weeks} semaines, ${sessions} en tout. Je vous écris une seule fois à ce sujet.`,
    sessions: (n: string) => `${n} séances`,
    why: "OpenAthlete n'a ni investisseur ni publicité, et ne vend pas vos données. Je le développe seul, et ce sont les Supporters qui paient les serveurs, la synchro des montres et l'IA.",
    count: (n: number, goal: string) =>
      n === 0
        ? `L'objectif : ${goal} Supporters, de quoi tout couvrir et consacrer plus de temps au projet.`
        : n === 1
          ? `Pour l'instant, une personne le fait. L'objectif : ${goal}, de quoi tout couvrir et consacrer plus de temps au projet.`
          : `Ils sont ${n} aujourd'hui. L'objectif : ${goal}, de quoi tout couvrir et consacrer plus de temps au projet.`,
    perks: [
      'Supporter, ce sont quelques euros par mois ou par an. Ça ajoute l’IA sans clé à fournir et les athlètes illimités pour les coachs. ',
      'Le détail est ici',
      '.',
    ],
    noPressure:
      "Si ce n'est pas le moment, aucun souci : tout reste gratuit, et je ne reviendrai pas à la charge.",
  },
  EN: {
    subject: 'one request, just once',
    preview: 'OpenAthlete has no investors and no ads.',
    since: (weeks: string, sessions: string) =>
      `Your sessions have been coming into OpenAthlete for ${weeks} weeks, ${sessions} in all. I'm writing to you about this once.`,
    sessions: (n: string) => `${n} sessions`,
    why: 'OpenAthlete has no investors and no ads, and does not sell your data. I build it on my own, and Supporters pay for the servers, the watch sync and the AI.',
    count: (n: number, goal: string) =>
      n === 0
        ? `The goal: ${goal} Supporters, enough to cover everything and give the project more time.`
        : n === 1
          ? `So far, one person does. The goal: ${goal}, enough to cover everything and give the project more time.`
          : `There are ${n} of them today. The goal: ${goal}, enough to cover everything and give the project more time.`,
    perks: [
      'Supporter costs a few euros a month or a year. It adds AI without a key of your own, and unlimited athletes for coaches. ',
      'The details are here',
      '.',
    ],
    noPressure:
      "If now isn't the time, no problem: everything stays free, and I won't ask again.",
  },
  IT: {
    subject: 'una richiesta, una volta sola',
    preview: 'OpenAthlete non ha investitori né pubblicità.',
    since: (weeks: string, sessions: string) =>
      `Le tue sessioni arrivano su OpenAthlete da ${weeks} settimane, ${sessions} in tutto. Ti scrivo una volta sola a questo proposito.`,
    sessions: (n: string) => `${n} sessioni`,
    why: 'OpenAthlete non ha investitori né pubblicità, e non vende i tuoi dati. Lo sviluppo da solo, e sono i Supporter a pagare i server, la sincronizzazione degli orologi e l’IA.',
    count: (n: number, goal: string) =>
      n === 0
        ? `L’obiettivo: ${goal} Supporter, abbastanza per coprire tutto e dedicare più tempo al progetto.`
        : n === 1
          ? `Per ora lo fa una persona. L’obiettivo: ${goal}, abbastanza per coprire tutto e dedicare più tempo al progetto.`
          : `Oggi sono ${n}. L’obiettivo: ${goal}, abbastanza per coprire tutto e dedicare più tempo al progetto.`,
    perks: [
      'Supporter costa pochi euro al mese o all’anno. Aggiunge l’IA senza una chiave tua e atleti illimitati per i coach. ',
      'I dettagli sono qui',
      '.',
    ],
    noPressure:
      'Se non è il momento, nessun problema: tutto resta gratuito e non te lo chiederò di nuovo.',
  },
  ES: {
    subject: 'una petición, una sola vez',
    preview: 'OpenAthlete no tiene inversores ni publicidad.',
    since: (weeks: string, sessions: string) =>
      `Tus sesiones llegan a OpenAthlete desde hace ${weeks} semanas, ${sessions} en total. Te escribo sobre esto una sola vez.`,
    sessions: (n: string) => `${n} sesiones`,
    why: 'OpenAthlete no tiene inversores ni publicidad, y no vende tus datos. Lo desarrollo solo, y son los Supporters quienes pagan los servidores, la sincronización de los relojes y la IA.',
    count: (n: number, goal: string) =>
      n === 0
        ? `El objetivo: ${goal} Supporters, suficiente para cubrirlo todo y dedicar más tiempo al proyecto.`
        : n === 1
          ? `Por ahora, una persona lo hace. El objetivo: ${goal}, suficiente para cubrirlo todo y dedicar más tiempo al proyecto.`
          : `Hoy son ${n}. El objetivo: ${goal}, suficiente para cubrirlo todo y dedicar más tiempo al proyecto.`,
    perks: [
      'Supporter cuesta unos pocos euros al mes o al año. Añade la IA sin clave propia y atletas ilimitados para los entrenadores. ',
      'Los detalles están aquí',
      '.',
    ],
    noPressure:
      'Si no es el momento, no pasa nada: todo sigue siendo gratis y no volveré a pedírtelo.',
  },
  PT_BR: {
    subject: 'um pedido, uma vez só',
    preview: 'O OpenAthlete não tem investidores nem anúncios.',
    since: (weeks: string, sessions: string) =>
      `Seus treinos chegam ao OpenAthlete há ${weeks} semanas, ${sessions} no total. Escrevo sobre isso uma vez só.`,
    sessions: (n: string) => `${n} treinos`,
    why: 'O OpenAthlete não tem investidores nem anúncios, e não vende seus dados. Eu desenvolvo sozinho, e são os Supporters que pagam os servidores, a sincronização dos relógios e a IA.',
    count: (n: number, goal: string) =>
      n === 0
        ? `A meta: ${goal} Supporters, o suficiente para cobrir tudo e dedicar mais tempo ao projeto.`
        : n === 1
          ? `Por enquanto, uma pessoa faz isso. A meta: ${goal}, o suficiente para cobrir tudo e dedicar mais tempo ao projeto.`
          : `Hoje são ${n}. A meta: ${goal}, o suficiente para cobrir tudo e dedicar mais tempo ao projeto.`,
    perks: [
      'Supporter custa alguns euros por mês ou por ano. Inclui a IA sem chave própria e atletas ilimitados para treinadores. ',
      'Os detalhes estão aqui',
      '.',
    ],
    noPressure:
      'Se não for o momento, sem problema: tudo continua gratuito e não vou pedir de novo.',
  },
} satisfies Record<EmailLanguage, unknown>;

export function buildSupporterAskEmail(
  props: LifecycleEmailProps & {
    weeks: number;
    activityCount: number;
    supporters: number;
    subscriptionUrl: string;
  },
): LifecycleEmail {
  const { language } = props;
  const t = translations[language];
  return {
    subject: t.subject,
    ...renderEmail({
      language,
      title: t.subject,
      preview: t.preview,
      footer: props.footer,
      variant: 'letter',
      blocks: [
        paragraph(greeting(language, props.name)),
        paragraph(
          t.since(
            formatNumber(language, props.weeks),
            t.sessions(formatNumber(language, props.activityCount)),
          ),
        ),
        paragraph(t.why),
        paragraph(
          t.count(props.supporters, formatNumber(language, SUPPORTER_GOAL)),
        ),
        paragraph(
          t.perks[0],
          { href: props.subscriptionUrl, label: t.perks[1] },
          t.perks[2],
        ),
        paragraph(t.noPressure),
        signature(props.signature),
      ],
    }),
  };
}
