import type { EmailLanguage } from '@openathlete/shared';

import {
  button,
  heading,
  paragraph,
  signature,
  stats,
} from '../../core/blocks';
import {
  capitalize,
  formatDuration,
  formatKm,
  formatNumber,
  monthName,
} from '../../core/format';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: (month: string, figure: string, sessions: string) =>
      `${month} : ${figure} en ${sessions}`,
    subjectNoDistance: (month: string, sessions: string) =>
      `${month} : ${sessions}`,
    sessions: (n: string, one: boolean) => (one ? '1 séance' : `${n} séances`),
    title: (month: string) => `${month} en chiffres`,
    preview: 'Votre mois en chiffres, et ce qui vient.',
    labels: ['Séances', 'Distance', 'Durée', 'Dénivelé'],
    more: (pct: string, prev: string) =>
      `C'est ${pct} % de plus qu'en ${prev}.`,
    less: (pct: string, prev: string) =>
      `C'est ${pct} % de moins qu'en ${prev}.`,
    same: (prev: string) => `Autant qu'en ${prev}, à peu de chose près.`,
    longest: (name: string, distance: string) =>
      `Plus longue sortie : ${name}, ${distance}.`,
    race: (name: string, days: number) =>
      days === 1
        ? `Prochaine course : ${name}, demain.`
        : `Prochaine course : ${name}, dans ${days} jours.`,
    button: 'Voir mes statistiques',
  },
  EN: {
    subject: (month: string, figure: string, sessions: string) =>
      `${month}: ${figure} in ${sessions}`,
    subjectNoDistance: (month: string, sessions: string) =>
      `${month}: ${sessions}`,
    sessions: (n: string, one: boolean) =>
      one ? '1 session' : `${n} sessions`,
    title: (month: string) => `${month} in figures`,
    preview: 'Your month in figures, and what comes next.',
    labels: ['Sessions', 'Distance', 'Time', 'Elevation'],
    more: (pct: string, prev: string) => `That's ${pct}% more than in ${prev}.`,
    less: (pct: string, prev: string) => `That's ${pct}% less than in ${prev}.`,
    same: (prev: string) => `About the same as ${prev}.`,
    longest: (name: string, distance: string) =>
      `Longest session: ${name}, ${distance}.`,
    race: (name: string, days: number) =>
      days === 1
        ? `Next race: ${name}, tomorrow.`
        : `Next race: ${name}, in ${days} days.`,
    button: 'See my statistics',
  },
  IT: {
    subject: (month: string, figure: string, sessions: string) =>
      `${month}: ${figure} in ${sessions}`,
    subjectNoDistance: (month: string, sessions: string) =>
      `${month}: ${sessions}`,
    sessions: (n: string, one: boolean) =>
      one ? '1 sessione' : `${n} sessioni`,
    title: (month: string) => `${month} in cifre`,
    preview: 'Il tuo mese in cifre, e quello che viene.',
    labels: ['Sessioni', 'Distanza', 'Durata', 'Dislivello'],
    more: (pct: string, prev: string) =>
      `È il ${pct}% in più rispetto a ${prev}.`,
    less: (pct: string, prev: string) =>
      `È il ${pct}% in meno rispetto a ${prev}.`,
    same: (prev: string) => `Più o meno come a ${prev}.`,
    longest: (name: string, distance: string) =>
      `Sessione più lunga: ${name}, ${distance}.`,
    race: (name: string, days: number) =>
      days === 1
        ? `Prossima gara: ${name}, domani.`
        : `Prossima gara: ${name}, tra ${days} giorni.`,
    button: 'Vedi le mie statistiche',
  },
  ES: {
    subject: (month: string, figure: string, sessions: string) =>
      `${month}: ${figure} en ${sessions}`,
    subjectNoDistance: (month: string, sessions: string) =>
      `${month}: ${sessions}`,
    sessions: (n: string, one: boolean) => (one ? '1 sesión' : `${n} sesiones`),
    title: (month: string) => `${month} en cifras`,
    preview: 'Tu mes en cifras, y lo que viene.',
    labels: ['Sesiones', 'Distancia', 'Tiempo', 'Desnivel'],
    more: (pct: string, prev: string) => `Es un ${pct} % más que en ${prev}.`,
    less: (pct: string, prev: string) => `Es un ${pct} % menos que en ${prev}.`,
    same: (prev: string) => `Más o menos como en ${prev}.`,
    longest: (name: string, distance: string) =>
      `Sesión más larga: ${name}, ${distance}.`,
    race: (name: string, days: number) =>
      days === 1
        ? `Próxima carrera: ${name}, mañana.`
        : `Próxima carrera: ${name}, dentro de ${days} días.`,
    button: 'Ver mis estadísticas',
  },
  PT_BR: {
    subject: (month: string, figure: string, sessions: string) =>
      `${month}: ${figure} em ${sessions}`,
    subjectNoDistance: (month: string, sessions: string) =>
      `${month}: ${sessions}`,
    sessions: (n: string, one: boolean) => (one ? '1 treino' : `${n} treinos`),
    title: (month: string) => `${month} em números`,
    preview: 'Seu mês em números, e o que vem por aí.',
    labels: ['Treinos', 'Distância', 'Tempo', 'Elevação'],
    more: (pct: string, prev: string) => `São ${pct}% a mais que em ${prev}.`,
    less: (pct: string, prev: string) => `São ${pct}% a menos que em ${prev}.`,
    same: (prev: string) => `Mais ou menos como em ${prev}.`,
    longest: (name: string, distance: string) =>
      `Treino mais longo: ${name}, ${distance}.`,
    race: (name: string, days: number) =>
      days === 1
        ? `Próxima prova: ${name}, amanhã.`
        : `Próxima prova: ${name}, daqui a ${days} dias.`,
    button: 'Ver minhas estatísticas',
  },
  DE: {
    subject: (month: string, figure: string, sessions: string) =>
      `${month}: ${figure} in ${sessions}`,
    subjectNoDistance: (month: string, sessions: string) =>
      `${month}: ${sessions}`,
    sessions: (n: string, one: boolean) =>
      one ? '1 Einheit' : `${n} Einheiten`,
    title: (month: string) => `Dein ${month} in Zahlen`,
    preview: 'Dein Monat in Zahlen, und was als Nächstes kommt.',
    labels: ['Einheiten', 'Distanz', 'Zeit', 'Höhenmeter'],
    more: (pct: string, prev: string) =>
      `Das sind ${pct} % mehr als im ${prev}.`,
    less: (pct: string, prev: string) =>
      `Das sind ${pct} % weniger als im ${prev}.`,
    same: (prev: string) => `Ungefähr so viel wie im ${prev}.`,
    longest: (name: string, distance: string) =>
      `Längste Einheit: ${name}, ${distance}.`,
    race: (name: string, days: number) =>
      days === 1
        ? `Nächster Wettkampf: ${name}, morgen.`
        : `Nächster Wettkampf: ${name}, in ${days} Tagen.`,
    button: 'Statistiken ansehen',
  },
} satisfies Record<EmailLanguage, unknown>;

/** Below this change, the two months count as the same */
const SAME_MONTH_THRESHOLD = 0.05;

export function buildMonthlyRecapEmail(
  props: LifecycleEmailProps & {
    /** YYYY-MM */
    month: string;
    previousMonth: string;
    count: number;
    distance: number;
    movingTime: number;
    elevationGain: number;
    /** Distance of the month before, to compare */
    previousDistance: number;
    longest: { name: string; distance: number } | null;
    nextRace: { name: string; daysLeft: number } | null;
    statisticsUrl: string;
  },
): LifecycleEmail {
  const { language } = props;
  const t = translations[language];
  const month = capitalize(monthName(language, props.month));
  const previous = monthName(language, props.previousMonth);
  const sessions = t.sessions(
    formatNumber(language, props.count),
    props.count === 1,
  );
  const hasDistance = props.distance >= 1000;
  const subject = hasDistance
    ? t.subject(month, formatKm(language, props.distance), sessions)
    : t.subjectNoDistance(month, sessions);

  let comparison: string | null = null;
  if (hasDistance && props.previousDistance >= 1000) {
    const change = props.distance / props.previousDistance - 1;
    const pct = formatNumber(language, Math.abs(change) * 100);
    comparison =
      Math.abs(change) < SAME_MONTH_THRESHOLD
        ? t.same(previous)
        : change > 0
          ? t.more(pct, previous)
          : t.less(pct, previous);
  }

  return {
    subject,
    ...renderEmail({
      language,
      title: subject,
      preview: t.preview,
      footer: props.footer,
      blocks: [
        heading(t.title(month)),
        paragraph(greeting(language, props.name)),
        stats([
          { label: t.labels[0], value: formatNumber(language, props.count) },
          { label: t.labels[1], value: formatKm(language, props.distance) },
        ]),
        stats([
          {
            label: t.labels[2],
            value: formatDuration(language, props.movingTime),
          },
          {
            label: t.labels[3],
            value: `${formatNumber(language, props.elevationGain)} m`,
          },
        ]),
        ...(comparison ? [paragraph(comparison)] : []),
        ...(props.longest && props.longest.distance >= 1000
          ? [
              paragraph(
                t.longest(
                  props.longest.name,
                  formatKm(language, props.longest.distance),
                ),
              ),
            ]
          : []),
        ...(props.nextRace
          ? [paragraph(t.race(props.nextRace.name, props.nextRace.daysLeft))]
          : []),
        button({ href: props.statisticsUrl, label: t.button }),
        signature(props.signature),
      ],
    }),
  };
}
