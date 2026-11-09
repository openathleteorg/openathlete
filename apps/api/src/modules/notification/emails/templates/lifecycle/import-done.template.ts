import type { EmailLanguage } from '@openathlete/shared';

import {
  button,
  heading,
  paragraph,
  signature,
  stats,
} from '../../core/blocks';
import {
  formatDuration,
  formatKm,
  formatMonthYear,
  formatNumber,
} from '../../core/format';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: (n: string, one: boolean) =>
      one ? '1 séance importée' : `${n} séances importées`,
    preview: 'Vos quatre dernières semaines en chiffres.',
    arrived: (provider: string, n: string, since: string) =>
      `Votre historique ${provider} est arrivé : ${n} depuis ${since}.`,
    sessions: (n: string, one: boolean) => (one ? '1 séance' : `${n} séances`),
    lastWeeks: 'Vos quatre dernières semaines :',
    labels: ['Séances', 'Distance', 'Durée'],
    race: (race: string, days: number) =>
      days === 1
        ? `Votre prochaine course, ${race}, c'est demain. Bonne course !`
        : `Votre prochaine course, ${race}, est dans ${days} jours. Le calendrier la compte déjà.`,
    raceButton: 'Ouvrir mon calendrier',
    noRace:
      "Étape suivante : ajoutez votre prochaine course dans le calendrier. OpenAthlete compte les semaines qui restent, et vous pouvez construire votre plan jusqu'au jour J.",
    noRaceButton: 'Ajouter ma course',
  },
  EN: {
    subject: (n: string, one: boolean) =>
      one ? '1 session imported' : `${n} sessions imported`,
    preview: 'Your last four weeks in figures.',
    arrived: (provider: string, n: string, since: string) =>
      `Your ${provider} history is in: ${n} since ${since}.`,
    sessions: (n: string, one: boolean) =>
      one ? '1 session' : `${n} sessions`,
    lastWeeks: 'Your last four weeks:',
    labels: ['Sessions', 'Distance', 'Time'],
    race: (race: string, days: number) =>
      days === 1
        ? `Your next race, ${race}, is tomorrow. Have a good one!`
        : `Your next race, ${race}, is ${days} days away. The calendar already counts down to it.`,
    raceButton: 'Open my calendar',
    noRace:
      'Next step: add your next race to the calendar. OpenAthlete counts the weeks left, and you can build your plan up to race day.',
    noRaceButton: 'Add my race',
  },
  IT: {
    subject: (n: string, one: boolean) =>
      one ? '1 sessione importata' : `${n} sessioni importate`,
    preview: 'Le tue ultime quattro settimane in cifre.',
    arrived: (provider: string, n: string, since: string) =>
      `Il tuo storico ${provider} è arrivato: ${n} da ${since}.`,
    sessions: (n: string, one: boolean) =>
      one ? '1 sessione' : `${n} sessioni`,
    lastWeeks: 'Le tue ultime quattro settimane:',
    labels: ['Sessioni', 'Distanza', 'Durata'],
    race: (race: string, days: number) =>
      days === 1
        ? `La tua prossima gara, ${race}, è domani. Buona gara!`
        : `La tua prossima gara, ${race}, è tra ${days} giorni. Il calendario la conta già.`,
    raceButton: 'Apri il mio calendario',
    noRace:
      'Prossimo passo: aggiungi la tua prossima gara al calendario. OpenAthlete conta le settimane che mancano e puoi costruire il tuo piano fino al giorno della gara.',
    noRaceButton: 'Aggiungi la mia gara',
  },
  ES: {
    subject: (n: string, one: boolean) =>
      one ? '1 sesión importada' : `${n} sesiones importadas`,
    preview: 'Tus últimas cuatro semanas en cifras.',
    arrived: (provider: string, n: string, since: string) =>
      `Ya llegó tu historial de ${provider}: ${n} desde ${since}.`,
    sessions: (n: string, one: boolean) => (one ? '1 sesión' : `${n} sesiones`),
    lastWeeks: 'Tus últimas cuatro semanas:',
    labels: ['Sesiones', 'Distancia', 'Tiempo'],
    race: (race: string, days: number) =>
      days === 1
        ? `Tu próxima carrera, ${race}, es mañana. ¡Buena carrera!`
        : `Tu próxima carrera, ${race}, es dentro de ${days} días. El calendario ya lleva la cuenta.`,
    raceButton: 'Abrir mi calendario',
    noRace:
      'Siguiente paso: añade tu próxima carrera al calendario. OpenAthlete cuenta las semanas que faltan y puedes preparar tu plan hasta el día de la carrera.',
    noRaceButton: 'Añadir mi carrera',
  },
  PT_BR: {
    subject: (n: string, one: boolean) =>
      one ? '1 treino importado' : `${n} treinos importados`,
    preview: 'Suas últimas quatro semanas em números.',
    arrived: (provider: string, n: string, since: string) =>
      `Seu histórico do ${provider} chegou: ${n} desde ${since}.`,
    sessions: (n: string, one: boolean) => (one ? '1 treino' : `${n} treinos`),
    lastWeeks: 'Suas últimas quatro semanas:',
    labels: ['Treinos', 'Distância', 'Tempo'],
    race: (race: string, days: number) =>
      days === 1
        ? `Sua próxima prova, ${race}, é amanhã. Boa prova!`
        : `Sua próxima prova, ${race}, é daqui a ${days} dias. O calendário já faz a contagem.`,
    raceButton: 'Abrir meu calendário',
    noRace:
      'Próximo passo: adicione sua próxima prova ao calendário. O OpenAthlete conta as semanas que faltam e você pode montar seu plano até o dia da prova.',
    noRaceButton: 'Adicionar minha prova',
  },
} satisfies Record<EmailLanguage, unknown>;

export function buildImportDoneEmail(
  props: LifecycleEmailProps & {
    provider: string;
    total: number;
    firstActivityAt: Date;
    lastFourWeeks: { count: number; distance: number; movingTime: number };
    nextRace: { name: string; daysLeft: number } | null;
    calendarUrl: string;
  },
): LifecycleEmail {
  const { language } = props;
  const t = translations[language];
  const total = formatNumber(language, props.total);
  const subject = t.subject(total, props.total === 1);
  const weeks = props.lastFourWeeks;

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
        paragraph(
          t.arrived(
            props.provider,
            t.sessions(total, props.total === 1),
            formatMonthYear(language, props.firstActivityAt),
          ),
        ),
        ...(weeks.count > 0
          ? [
              paragraph(t.lastWeeks),
              stats([
                {
                  label: t.labels[0],
                  value: formatNumber(language, weeks.count),
                },
                {
                  label: t.labels[1],
                  value: formatKm(language, weeks.distance),
                },
                {
                  label: t.labels[2],
                  value: formatDuration(language, weeks.movingTime),
                },
              ]),
            ]
          : []),
        ...(props.nextRace
          ? [
              paragraph(t.race(props.nextRace.name, props.nextRace.daysLeft)),
              button({ href: props.calendarUrl, label: t.raceButton }),
            ]
          : [
              paragraph(t.noRace),
              button({ href: props.calendarUrl, label: t.noRaceButton }),
            ]),
        signature(props.signature),
      ],
    }),
  };
}
