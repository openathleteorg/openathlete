import type { EmailLanguage } from '@openathlete/shared';

import {
  Block,
  button,
  heading,
  note,
  paragraph,
  signature,
} from '../../core/blocks';
import { formatNumber, polishPlural } from '../../core/format';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    // Between the athlete's name and what to look at
    sep: ' : ',
    subject: (n: number) =>
      n === 1
        ? 'Tes athlètes : 1 à regarder cette semaine'
        : `Tes athlètes : ${n} à regarder cette semaine`,
    preview: 'Séances manquées, charge en hausse, questionnaires remplis.',
    title: 'Tes athlètes cette semaine',
    intro: 'Voici ceux qui méritent un coup d’œil après la semaine passée.',
    missed: (n: number) =>
      n === 1 ? '1 séance manquée' : `${n} séances manquées`,
    load: (pct: string) =>
      `charge en forte hausse : +${pct} % sur la moyenne des 4 semaines d’avant`,
    answers: (n: number) =>
      n === 1 ? '1 questionnaire rempli' : `${n} questionnaires remplis`,
    calendar: 'Son calendrier',
    more: (n: number) =>
      n === 1 ? 'Et 1 autre athlète.' : `Et ${n} autres athlètes.`,
    button: 'Ouvrir le tableau de bord',
    garmin: "Analyses issues en partie de données d'appareils Garmin.",
  },
  EN: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) =>
      n === 1
        ? 'Your athletes: 1 to look at this week'
        : `Your athletes: ${n} to look at this week`,
    preview: 'Missed sessions, rising load, questionnaires answered.',
    title: 'Your athletes this week',
    intro: 'These are the ones worth a look after last week.',
    missed: (n: number) =>
      n === 1 ? '1 missed session' : `${n} missed sessions`,
    load: (pct: string) =>
      `load sharply up: +${pct}% on the average of the 4 weeks before`,
    answers: (n: number) =>
      n === 1 ? '1 questionnaire answered' : `${n} questionnaires answered`,
    calendar: 'Their calendar',
    more: (n: number) =>
      n === 1 ? 'And 1 more athlete.' : `And ${n} more athletes.`,
    button: 'Open the dashboard',
    garmin: 'Insights derived in part from Garmin device-sourced data.',
  },
  IT: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) =>
      n === 1
        ? 'I tuoi atleti: 1 da guardare questa settimana'
        : `I tuoi atleti: ${n} da guardare questa settimana`,
    preview: 'Sessioni saltate, carico in aumento, questionari compilati.',
    title: 'I tuoi atleti questa settimana',
    intro: 'Ecco quelli che meritano un’occhiata dopo la settimana passata.',
    missed: (n: number) =>
      n === 1 ? '1 sessione saltata' : `${n} sessioni saltate`,
    load: (pct: string) =>
      `carico in forte aumento: +${pct}% sulla media delle 4 settimane prima`,
    answers: (n: number) =>
      n === 1 ? '1 questionario compilato' : `${n} questionari compilati`,
    calendar: 'Il suo calendario',
    more: (n: number) =>
      n === 1 ? 'E 1 altro atleta.' : `E altri ${n} atleti.`,
    button: 'Apri la dashboard',
    garmin: 'Analisi derivate in parte da dati di dispositivi Garmin.',
  },
  ES: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) =>
      n === 1
        ? 'Tus atletas: 1 para revisar esta semana'
        : `Tus atletas: ${n} para revisar esta semana`,
    preview: 'Sesiones perdidas, carga en aumento, cuestionarios respondidos.',
    title: 'Tus atletas esta semana',
    intro: 'Estos son los que merecen un vistazo tras la semana pasada.',
    missed: (n: number) =>
      n === 1 ? '1 sesión perdida' : `${n} sesiones perdidas`,
    load: (pct: string) =>
      `carga muy en aumento: +${pct} % sobre la media de las 4 semanas anteriores`,
    answers: (n: number) =>
      n === 1 ? '1 cuestionario respondido' : `${n} cuestionarios respondidos`,
    calendar: 'Su calendario',
    more: (n: number) => (n === 1 ? 'Y 1 atleta más.' : `Y ${n} atletas más.`),
    button: 'Abrir el panel',
    garmin: 'Análisis derivados en parte de datos de dispositivos Garmin.',
  },
  PT_BR: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) =>
      n === 1
        ? 'Seus atletas: 1 para olhar esta semana'
        : `Seus atletas: ${n} para olhar esta semana`,
    preview: 'Treinos perdidos, carga em alta, questionários respondidos.',
    title: 'Seus atletas esta semana',
    intro: 'Estes merecem uma olhada depois da semana passada.',
    missed: (n: number) =>
      n === 1 ? '1 treino perdido' : `${n} treinos perdidos`,
    load: (pct: string) =>
      `carga em forte alta: +${pct}% sobre a média das 4 semanas anteriores`,
    answers: (n: number) =>
      n === 1 ? '1 questionário respondido' : `${n} questionários respondidos`,
    calendar: 'Calendário',
    more: (n: number) =>
      n === 1 ? 'E mais 1 atleta.' : `E mais ${n} atletas.`,
    button: 'Abrir o painel',
    garmin: 'Análises derivadas em parte de dados de dispositivos Garmin.',
  },
  DE: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) =>
      n === 1
        ? 'Deine Athleten: 1 zum Anschauen diese Woche'
        : `Deine Athleten: ${n} zum Anschauen diese Woche`,
    preview:
      'Verpasste Einheiten, steigende Belastung, ausgefüllte Fragebögen.',
    title: 'Deine Athleten diese Woche',
    intro: 'Diese verdienen nach der letzten Woche einen Blick.',
    missed: (n: number) =>
      n === 1 ? '1 verpasste Einheit' : `${n} verpasste Einheiten`,
    load: (pct: string) =>
      `Belastung stark gestiegen: +${pct} % gegenüber dem Schnitt der 4 Wochen davor`,
    answers: (n: number) =>
      n === 1 ? '1 Fragebogen ausgefüllt' : `${n} Fragebögen ausgefüllt`,
    calendar: 'Kalender',
    more: (n: number) =>
      n === 1 ? 'Und 1 weiterer Athlet.' : `Und ${n} weitere Athleten.`,
    button: 'Dashboard öffnen',
    garmin: 'Erkenntnisse teilweise aus Daten von Garmin-Geräten abgeleitet.',
  },
  PL: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) =>
      `Twoi zawodnicy: ${n} do sprawdzenia w tym tygodniu`,
    preview: 'Opuszczone treningi, rosnące obciążenie, wypełnione ankiety.',
    title: 'Twoi zawodnicy w tym tygodniu',
    intro: 'Oto ci, którym warto się przyjrzeć po minionym tygodniu.',
    missed: (n: number) =>
      `${n} ${polishPlural(n, 'opuszczony trening', 'opuszczone treningi', 'opuszczonych treningów')}`,
    load: (pct: string) =>
      `obciążenie mocno w górę: +${pct} % względem średniej z 4 poprzednich tygodni`,
    answers: (n: number) =>
      `${n} ${polishPlural(n, 'wypełniona ankieta', 'wypełnione ankiety', 'wypełnionych ankiet')}`,
    calendar: 'Kalendarz',
    more: (n: number) =>
      n === 1 ? 'I jeszcze 1 zawodnik.' : `I jeszcze ${n} zawodników.`,
    button: 'Otwórz panel',
    garmin: 'Analizy oparte częściowo na danych z urządzeń Garmin.',
  },
  NL: {
    // Between the athlete's name and what to look at
    sep: ': ',
    subject: (n: number) => `Je atleten: ${n} om naar te kijken deze week`,
    preview:
      'Gemiste trainingen, stijgende belasting, ingevulde vragenlijsten.',
    title: 'Je atleten deze week',
    intro: 'Deze verdienen een blik na afgelopen week.',
    missed: (n: number) =>
      n === 1 ? '1 gemiste training' : `${n} gemiste trainingen`,
    load: (pct: string) =>
      `belasting flink omhoog: +${pct}% ten opzichte van het gemiddelde van de 4 weken ervoor`,
    answers: (n: number) =>
      n === 1 ? '1 vragenlijst ingevuld' : `${n} vragenlijsten ingevuld`,
    calendar: 'Agenda',
    more: (n: number) =>
      n === 1 ? 'En nog 1 atleet.' : `En nog ${n} atleten.`,
    button: 'Dashboard openen',
    garmin: 'Inzichten deels afgeleid van gegevens van Garmin-apparaten.',
  },
} satisfies Record<EmailLanguage, unknown>;

const MAX_ATHLETES_SHOWN = 15;

export interface CoachWeeklyAthlete {
  name: string;
  /** Planned trainings of the past week with no activity linked */
  missed: number;
  /** Rise of the week's TRIMP over the 4 weeks before, as a ratio; null if not sharp */
  loadRise: number | null;
  /** The coach's questionnaires the athlete answered during the week */
  answers: number;
  calendarUrl: string;
}

export interface CoachWeeklyProps extends LifecycleEmailProps {
  /** Only athletes with something to look at, most signals first */
  athletes: CoachWeeklyAthlete[];
  dashboardUrl: string;
  /** Garmin data feeds the loads shown */
  garmin: boolean;
}

export function buildCoachWeeklyEmail(props: CoachWeeklyProps): LifecycleEmail {
  const { language, athletes } = props;
  const t = translations[language];
  const subject = t.subject(athletes.length);

  const shown = athletes.slice(0, MAX_ATHLETES_SHOWN);
  const athleteBlocks: Block[] = shown.map((athlete) => {
    const signals = [
      athlete.missed > 0 ? t.missed(athlete.missed) : null,
      athlete.loadRise !== null
        ? t.load(formatNumber(language, athlete.loadRise * 100))
        : null,
      athlete.answers > 0 ? t.answers(athlete.answers) : null,
    ].filter((signal): signal is string => signal !== null);
    return paragraph(
      { strong: athlete.name },
      `${t.sep}${signals.join(' · ')}. `,
      { href: athlete.calendarUrl, label: t.calendar },
    );
  });
  const hidden = athletes.length - shown.length;

  return {
    subject,
    ...renderEmail({
      language,
      title: subject,
      preview: t.preview,
      footer: props.footer,
      blocks: [
        heading(t.title),
        paragraph(greeting(language, props.name)),
        paragraph(t.intro),
        ...athleteBlocks,
        ...(hidden > 0 ? [paragraph(t.more(hidden))] : []),
        button({ href: props.dashboardUrl, label: t.button }),
        signature(props.signature),
        ...(props.garmin ? [note(t.garmin)] : []),
      ],
    }),
  };
}
