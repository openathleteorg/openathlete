import { type EmailLanguage, SUPPORTER_GOAL } from '@openathlete/shared';

import { paragraph, signature } from '../../core/blocks';
import { formatNumber, polishPlural } from '../../core/format';
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
  DE: {
    subject: 'eine Bitte, nur dieses eine Mal',
    preview: 'OpenAthlete hat weder Investoren noch Werbung.',
    since: (weeks: string, sessions: string) =>
      `Deine Aktivitäten landen seit ${weeks} Wochen in OpenAthlete, insgesamt ${sessions}. Ich schreibe dir deswegen nur ein einziges Mal.`,
    sessions: (n: string) => `${n} Aktivitäten`,
    why: 'OpenAthlete hat weder Investoren noch Werbung und verkauft deine Daten nicht. Ich entwickle es allein, und die Supporter bezahlen die Server, die Synchronisierung der Uhren und die KI.',
    count: (n: number, goal: string) =>
      n === 0
        ? `Das Ziel: ${goal} Supporter, genug, um alles zu decken und dem Projekt mehr Zeit zu widmen.`
        : n === 1
          ? `Bisher macht das eine Person. Das Ziel: ${goal}, genug, um alles zu decken und dem Projekt mehr Zeit zu widmen.`
          : `Heute sind es ${n}. Das Ziel: ${goal}, genug, um alles zu decken und dem Projekt mehr Zeit zu widmen.`,
    perks: [
      'Supporter kostet ein paar Euro im Monat oder im Jahr. Dazu gehören KI ohne eigenen Schlüssel und unbegrenzt viele Athleten für Coaches. ',
      'Alle Details findest du hier',
      '.',
    ],
    noPressure:
      'Wenn es gerade nicht passt, kein Problem: Alles bleibt kostenlos, und ich frage nicht noch einmal.',
  },
  PL: {
    subject: 'jedna prośba, tylko raz',
    preview: 'OpenAthlete nie ma inwestorów ani reklam.',
    since: (weeks: string, sessions: string) =>
      `Twoje treningi trafiają do OpenAthlete od ${weeks} tygodni, łącznie ${sessions}. Piszę do Ciebie w tej sprawie tylko ten jeden raz.`,
    sessions: (n: string) =>
      `${n} ${polishPlural(n, 'trening', 'treningi', 'treningów')}`,
    why: 'OpenAthlete nie ma inwestorów ani reklam i nie sprzedaje Twoich danych. Rozwijam go sam, a Supporterzy płacą za serwery, synchronizację zegarków i AI.',
    count: (n: number, goal: string) =>
      n === 0
        ? `Cel: ${goal} Supporterów, tylu, by pokryć wszystkie koszty i dać projektowi więcej czasu.`
        : n === 1
          ? `Na razie robi to jedna osoba. Cel: ${goal}, tylu, by pokryć wszystkie koszty i dać projektowi więcej czasu.`
          : `Na dziś jest ich ${n}. Cel: ${goal}, tylu, by pokryć wszystkie koszty i dać projektowi więcej czasu.`,
    perks: [
      'Supporter kosztuje kilka euro miesięcznie lub rocznie. Daje dostęp do AI bez własnego klucza, a trenerom nieograniczoną liczbę zawodników. ',
      'Szczegóły znajdziesz tutaj',
      '.',
    ],
    noPressure:
      'Jeśli to nie jest dobry moment, nie ma problemu: wszystko zostaje darmowe i więcej nie zapytam.',
  },
  NL: {
    subject: 'één verzoek, maar één keer',
    preview: 'OpenAthlete heeft geen investeerders en geen advertenties.',
    since: (weeks: string, sessions: string) =>
      `Je trainingen komen al ${weeks} weken binnen in OpenAthlete, ${sessions} in totaal. Ik schrijf je hierover maar één keer.`,
    sessions: (n: string) => `${n} trainingen`,
    why: 'OpenAthlete heeft geen investeerders en geen advertenties, en verkoopt je gegevens niet. Ik bouw het in mijn eentje, en Supporters betalen de servers, de synchronisatie met horloges en de AI.',
    count: (n: number, goal: string) =>
      n === 0
        ? `Het doel: ${goal} Supporters, genoeg om alles te dekken en het project meer tijd te geven.`
        : n === 1
          ? `Tot nu toe doet één persoon dat. Het doel: ${goal}, genoeg om alles te dekken en het project meer tijd te geven.`
          : `Vandaag zijn het er ${n}. Het doel: ${goal}, genoeg om alles te dekken en het project meer tijd te geven.`,
    perks: [
      'Supporter kost een paar euro per maand of per jaar. Je krijgt er AI bij zonder eigen sleutel, en onbeperkt atleten voor coaches. ',
      'Alle details vind je hier',
      '.',
    ],
    noPressure:
      'Komt het nu niet uit? Geen probleem: alles blijft gratis, en ik vraag het niet nog een keer.',
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
