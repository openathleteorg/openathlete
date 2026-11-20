import type { EmailLanguage } from '@openathlete/shared';

import {
  Block,
  button,
  facts,
  heading,
  note,
  paragraph,
  progress,
  signature,
  stats,
  subheading,
} from '../../core/blocks';
import {
  capitalize,
  formatDuration,
  formatKm,
  formatNumber,
  formatWeekday,
  polishPlural,
} from '../../core/format';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

type FormStatus = 'fatigue' | 'balanced' | 'fresh';
type Trend = 'up' | 'down' | 'stable';

// Form words are the app's (apps/web/messages: form_*, fitness_ctl,
// fatigue_atl, garmin_attribution_insights), so the email reads like it
const translations = {
  FR: {
    subject: (figure: string) => `Ta semaine : ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} ${done > 1 ? 'séances' : 'séance'} sur ${planned} ${planned > 1 ? 'prévues' : 'prévue'}`,
    sessions: (n: number) => (n === 1 ? '1 séance' : `${n} séances`),
    elevation: (m: string) => `${m} m D+`,
    rest: 'une semaine de repos',
    preview: 'La semaine passée, ta forme, et ce qui vient.',
    title: 'Ta semaine',
    past: 'La semaine passée',
    labels: {
      sessions: 'Séances',
      time: 'Durée',
      distance: 'Distance',
      elevation: 'Dénivelé',
    },
    doneOf: (done: string, planned: string) => `${done} sur ${planned}`,
    nothingDone: 'Aucune séance enregistrée la semaine passée.',
    load: (trimp: string) => `Charge : ${trimp} TRIMP.`,
    more: (pct: string) => `${pct} % de plus que la semaine d'avant.`,
    less: (pct: string) => `${pct} % de moins que la semaine d'avant.`,
    same: 'Autant que la semaine d’avant, à peu de chose près.',
    timeMore: (pct: string) =>
      `${pct} % de temps d’entraînement en plus que la semaine d'avant.`,
    timeLess: (pct: string) =>
      `${pct} % de temps d’entraînement en moins que la semaine d'avant.`,
    form: 'Ta forme',
    fitness: 'Forme (CTL)',
    fatigue: 'Fatigue (ATL)',
    status: {
      fatigue: 'Fatigue élevée',
      balanced: 'Équilibre',
      fresh: 'Très frais',
    },
    tsb: (status: string, tsb: string) =>
      `${status} : fraîcheur (TSB) à ${tsb}.`,
    trend: {
      up: 'Fatigue en hausse : la semaine a été chargée.',
      down: 'Fatigue en baisse : la semaine a été plus légère.',
      stable: 'Fatigue stable par rapport à la semaine d’avant.',
    },
    next: 'La semaine qui vient',
    nothingPlanned: 'Rien de prévu pour l’instant.',
    race: (name: string, days: number) =>
      days === 1
        ? `Prochaine course : ${name}, demain.`
        : `Prochaine course : ${name}, dans ${days} jours.`,
    see: 'Voir ma semaine',
    plan: 'Planifie ta semaine',
    garmin: "Analyses issues en partie de données d'appareils Garmin.",
    supporters: (n: string, goal: string) =>
      `OpenAthlete vit sans pub ni investisseur, grâce à ses Supporters : ${n} sur un objectif de ${goal}.`,
    supportersLink: 'En savoir plus',
  },
  EN: {
    subject: (figure: string) => `Your week: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} of ${planned} planned ${planned > 1 ? 'sessions' : 'session'}`,
    sessions: (n: number) => (n === 1 ? '1 session' : `${n} sessions`),
    elevation: (m: string) => `${m} m climbed`,
    rest: 'a week of rest',
    preview: 'Last week, your form, and what comes next.',
    title: 'Your week',
    past: 'Last week',
    labels: {
      sessions: 'Sessions',
      time: 'Time',
      distance: 'Distance',
      elevation: 'Elevation',
    },
    doneOf: (done: string, planned: string) => `${done} of ${planned}`,
    nothingDone: 'No session recorded last week.',
    load: (trimp: string) => `Load: ${trimp} TRIMP.`,
    more: (pct: string) => `${pct}% more than the week before.`,
    less: (pct: string) => `${pct}% less than the week before.`,
    same: 'About the same as the week before.',
    timeMore: (pct: string) =>
      `${pct}% more training time than the week before.`,
    timeLess: (pct: string) =>
      `${pct}% less training time than the week before.`,
    form: 'Your form',
    fitness: 'Fitness (CTL)',
    fatigue: 'Fatigue (ATL)',
    status: {
      fatigue: 'High fatigue',
      balanced: 'Balanced',
      fresh: 'Very fresh',
    },
    tsb: (status: string, tsb: string) => `${status}: form (TSB) at ${tsb}.`,
    trend: {
      up: 'Fatigue rising: it was a heavy week.',
      down: 'Fatigue falling: it was a lighter week.',
      stable: 'Fatigue steady compared with the week before.',
    },
    next: 'The week ahead',
    nothingPlanned: 'Nothing planned yet.',
    race: (name: string, days: number) =>
      days === 1
        ? `Next race: ${name}, tomorrow.`
        : `Next race: ${name}, in ${days} days.`,
    see: 'See my week',
    plan: 'Plan your week',
    garmin: 'Insights derived in part from Garmin device-sourced data.',
    supporters: (n: string, goal: string) =>
      `OpenAthlete runs without ads or investors, thanks to its Supporters: ${n} out of a goal of ${goal}.`,
    supportersLink: 'Learn more',
  },
  IT: {
    subject: (figure: string) => `La tua settimana: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} ${done === 1 ? 'sessione' : 'sessioni'} su ${planned} ${planned > 1 ? 'previste' : 'prevista'}`,
    sessions: (n: number) => (n === 1 ? '1 sessione' : `${n} sessioni`),
    elevation: (m: string) => `${m} m D+`,
    rest: 'una settimana di riposo',
    preview: 'La settimana passata, la tua forma, e quello che viene.',
    title: 'La tua settimana',
    past: 'La settimana passata',
    labels: {
      sessions: 'Sessioni',
      time: 'Durata',
      distance: 'Distanza',
      elevation: 'Dislivello',
    },
    doneOf: (done: string, planned: string) => `${done} su ${planned}`,
    nothingDone: 'Nessuna sessione registrata la settimana scorsa.',
    load: (trimp: string) => `Carico: ${trimp} TRIMP.`,
    more: (pct: string) => `Il ${pct}% in più rispetto alla settimana prima.`,
    less: (pct: string) => `Il ${pct}% in meno rispetto alla settimana prima.`,
    same: 'Più o meno come la settimana prima.',
    timeMore: (pct: string) =>
      `Il ${pct}% di tempo di allenamento in più rispetto alla settimana prima.`,
    timeLess: (pct: string) =>
      `Il ${pct}% di tempo di allenamento in meno rispetto alla settimana prima.`,
    form: 'La tua forma',
    fitness: 'Forma (CTL)',
    fatigue: 'Fatica (ATL)',
    status: {
      fatigue: 'Fatica elevata',
      balanced: 'Equilibrio',
      fresh: 'Molto fresco',
    },
    tsb: (status: string, tsb: string) =>
      `${status}: freschezza (TSB) a ${tsb}.`,
    trend: {
      up: 'Fatica in aumento: la settimana è stata intensa.',
      down: 'Fatica in calo: la settimana è stata più leggera.',
      stable: 'Fatica stabile rispetto alla settimana prima.',
    },
    next: 'La settimana che viene',
    nothingPlanned: 'Ancora niente in programma.',
    race: (name: string, days: number) =>
      days === 1
        ? `Prossima gara: ${name}, domani.`
        : `Prossima gara: ${name}, tra ${days} giorni.`,
    see: 'Vedi la mia settimana',
    plan: 'Pianifica la tua settimana',
    garmin: 'Analisi derivate in parte da dati di dispositivi Garmin.',
    supporters: (n: string, goal: string) =>
      `OpenAthlete vive senza pubblicità né investitori, grazie ai suoi Supporter: ${n} su un obiettivo di ${goal}.`,
    supportersLink: 'Scopri di più',
  },
  ES: {
    subject: (figure: string) => `Tu semana: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} ${done === 1 ? 'sesión' : 'sesiones'} de ${planned} ${planned > 1 ? 'previstas' : 'prevista'}`,
    sessions: (n: number) => (n === 1 ? '1 sesión' : `${n} sesiones`),
    elevation: (m: string) => `${m} m D+`,
    rest: 'una semana de descanso',
    preview: 'La semana pasada, tu forma y lo que viene.',
    title: 'Tu semana',
    past: 'La semana pasada',
    labels: {
      sessions: 'Sesiones',
      time: 'Tiempo',
      distance: 'Distancia',
      elevation: 'Desnivel',
    },
    doneOf: (done: string, planned: string) => `${done} de ${planned}`,
    nothingDone: 'Ninguna sesión registrada la semana pasada.',
    load: (trimp: string) => `Carga: ${trimp} TRIMP.`,
    more: (pct: string) => `Un ${pct} % más que la semana anterior.`,
    less: (pct: string) => `Un ${pct} % menos que la semana anterior.`,
    same: 'Más o menos como la semana anterior.',
    timeMore: (pct: string) =>
      `Un ${pct} % más de tiempo de entrenamiento que la semana anterior.`,
    timeLess: (pct: string) =>
      `Un ${pct} % menos de tiempo de entrenamiento que la semana anterior.`,
    form: 'Tu forma',
    fitness: 'Forma física (CTL)',
    fatigue: 'Fatiga (ATL)',
    status: {
      fatigue: 'Fatiga alta',
      balanced: 'Equilibrio',
      fresh: 'Muy fresco',
    },
    tsb: (status: string, tsb: string) =>
      `${status}: frescura (TSB) en ${tsb}.`,
    trend: {
      up: 'Fatiga en aumento: la semana fue exigente.',
      down: 'Fatiga en descenso: la semana fue más ligera.',
      stable: 'Fatiga estable respecto a la semana anterior.',
    },
    next: 'La semana que viene',
    nothingPlanned: 'Nada previsto por ahora.',
    race: (name: string, days: number) =>
      days === 1
        ? `Próxima carrera: ${name}, mañana.`
        : `Próxima carrera: ${name}, dentro de ${days} días.`,
    see: 'Ver mi semana',
    plan: 'Planifica tu semana',
    garmin: 'Análisis derivados en parte de datos de dispositivos Garmin.',
    supporters: (n: string, goal: string) =>
      `OpenAthlete vive sin publicidad ni inversores, gracias a sus Supporters: ${n} de un objetivo de ${goal}.`,
    supportersLink: 'Saber más',
  },
  PT_BR: {
    subject: (figure: string) => `Sua semana: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} de ${planned} ${planned > 1 ? 'treinos previstos' : 'treino previsto'}`,
    sessions: (n: number) => (n === 1 ? '1 treino' : `${n} treinos`),
    elevation: (m: string) => `${m} m de subida`,
    rest: 'uma semana de descanso',
    preview: 'A semana passada, sua forma e o que vem por aí.',
    title: 'Sua semana',
    past: 'A semana passada',
    labels: {
      sessions: 'Treinos',
      time: 'Tempo',
      distance: 'Distância',
      elevation: 'Elevação',
    },
    doneOf: (done: string, planned: string) => `${done} de ${planned}`,
    nothingDone: 'Nenhum treino registrado na semana passada.',
    load: (trimp: string) => `Carga: ${trimp} TRIMP.`,
    more: (pct: string) => `${pct}% a mais que na semana anterior.`,
    less: (pct: string) => `${pct}% a menos que na semana anterior.`,
    same: 'Mais ou menos como na semana anterior.',
    timeMore: (pct: string) =>
      `${pct}% a mais de tempo de treino que na semana anterior.`,
    timeLess: (pct: string) =>
      `${pct}% a menos de tempo de treino que na semana anterior.`,
    form: 'Sua forma',
    fitness: 'Condicionamento (CTL)',
    fatigue: 'Fadiga (ATL)',
    status: {
      fatigue: 'Fadiga alta',
      balanced: 'Equilíbrio',
      fresh: 'Muito descansado',
    },
    tsb: (status: string, tsb: string) => `${status}: forma (TSB) em ${tsb}.`,
    trend: {
      up: 'Fadiga em alta: a semana foi pesada.',
      down: 'Fadiga em queda: a semana foi mais leve.',
      stable: 'Fadiga estável em relação à semana anterior.',
    },
    next: 'A semana que vem',
    nothingPlanned: 'Nada planejado por enquanto.',
    race: (name: string, days: number) =>
      days === 1
        ? `Próxima prova: ${name}, amanhã.`
        : `Próxima prova: ${name}, daqui a ${days} dias.`,
    see: 'Ver minha semana',
    plan: 'Planeje sua semana',
    garmin: 'Análises derivadas em parte de dados de dispositivos Garmin.',
    supporters: (n: string, goal: string) =>
      `O OpenAthlete vive sem anúncios nem investidores, graças aos seus Supporters: ${n} de uma meta de ${goal}.`,
    supportersLink: 'Saiba mais',
  },
  DE: {
    subject: (figure: string) => `Deine Woche: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} von ${planned} geplanten ${planned > 1 ? 'Einheiten' : 'Einheit'}`,
    sessions: (n: number) => (n === 1 ? '1 Einheit' : `${n} Einheiten`),
    elevation: (m: string) => `${m} Hm`,
    rest: 'eine Woche Pause',
    preview: 'Die letzte Woche, deine Form und was kommt.',
    title: 'Deine Woche',
    past: 'Die letzte Woche',
    labels: {
      sessions: 'Einheiten',
      time: 'Zeit',
      distance: 'Distanz',
      elevation: 'Höhenmeter',
    },
    doneOf: (done: string, planned: string) => `${done} von ${planned}`,
    nothingDone: 'Letzte Woche wurde keine Einheit aufgezeichnet.',
    load: (trimp: string) => `Belastung: ${trimp} TRIMP.`,
    more: (pct: string) => `${pct} % mehr als in der Woche davor.`,
    less: (pct: string) => `${pct} % weniger als in der Woche davor.`,
    same: 'Ungefähr so viel wie in der Woche davor.',
    timeMore: (pct: string) =>
      `${pct} % mehr Trainingszeit als in der Woche davor.`,
    timeLess: (pct: string) =>
      `${pct} % weniger Trainingszeit als in der Woche davor.`,
    form: 'Deine Form',
    fitness: 'Fitness (CTL)',
    fatigue: 'Ermüdung (ATL)',
    status: {
      fatigue: 'Hohe Ermüdung',
      balanced: 'Ausgeglichen',
      fresh: 'Sehr frisch',
    },
    tsb: (status: string, tsb: string) =>
      `${status}: Frische (TSB) bei ${tsb}.`,
    trend: {
      up: 'Ermüdung steigt: Die Woche war anstrengend.',
      down: 'Ermüdung sinkt: Die Woche war leichter.',
      stable: 'Ermüdung stabil im Vergleich zur Woche davor.',
    },
    next: 'Die kommende Woche',
    nothingPlanned: 'Noch nichts geplant.',
    race: (name: string, days: number) =>
      days === 1
        ? `Nächster Wettkampf: ${name}, morgen.`
        : `Nächster Wettkampf: ${name}, in ${days} Tagen.`,
    see: 'Meine Woche ansehen',
    plan: 'Plane deine Woche',
    garmin: 'Erkenntnisse teilweise aus Daten von Garmin-Geräten abgeleitet.',
    supporters: (n: string, goal: string) =>
      `OpenAthlete lebt ohne Werbung und ohne Investoren, dank seiner Supporter: ${n} von einem Ziel von ${goal}.`,
    supportersLink: 'Mehr erfahren',
  },
  PL: {
    subject: (figure: string) => `Twój tydzień: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} z ${planned} ${planned > 1 ? 'zaplanowanych treningów' : 'zaplanowanego treningu'}`,
    sessions: (n: number) =>
      `${n} ${polishPlural(n, 'trening', 'treningi', 'treningów')}`,
    elevation: (m: string) => `${m} m przewyższenia`,
    rest: 'tydzień odpoczynku',
    preview: 'Miniony tydzień, Twoja forma i to, co przed Tobą.',
    title: 'Twój tydzień',
    past: 'Miniony tydzień',
    labels: {
      sessions: 'Treningi',
      time: 'Czas',
      distance: 'Dystans',
      elevation: 'Przewyższenie',
    },
    doneOf: (done: string, planned: string) => `${done} z ${planned}`,
    nothingDone: 'W zeszłym tygodniu nie zarejestrowano żadnego treningu.',
    load: (trimp: string) => `Obciążenie: ${trimp} TRIMP.`,
    more: (pct: string) => `O ${pct} % więcej niż tydzień wcześniej.`,
    less: (pct: string) => `O ${pct} % mniej niż tydzień wcześniej.`,
    same: 'Mniej więcej tyle samo co tydzień wcześniej.',
    timeMore: (pct: string) =>
      `O ${pct} % więcej czasu treningu niż tydzień wcześniej.`,
    timeLess: (pct: string) =>
      `O ${pct} % mniej czasu treningu niż tydzień wcześniej.`,
    form: 'Twoja forma',
    fitness: 'Kondycja (CTL)',
    fatigue: 'Zmęczenie (ATL)',
    status: {
      fatigue: 'Duże zmęczenie',
      balanced: 'Równowaga',
      fresh: 'Pełna świeżość',
    },
    tsb: (status: string, tsb: string) =>
      `${status}: forma (TSB) na poziomie ${tsb}.`,
    trend: {
      up: 'Zmęczenie rośnie: to był mocny tydzień.',
      down: 'Zmęczenie spada: to był lżejszy tydzień.',
      stable: 'Zmęczenie stabilne w porównaniu z poprzednim tygodniem.',
    },
    next: 'Nadchodzący tydzień',
    nothingPlanned: 'Na razie nic nie zaplanowano.',
    race: (name: string, days: number) =>
      days === 1
        ? `Najbliższy start: ${name}, jutro.`
        : `Najbliższy start: ${name}, za ${days} dni.`,
    see: 'Zobacz mój tydzień',
    plan: 'Zaplanuj swój tydzień',
    garmin: 'Analizy oparte częściowo na danych z urządzeń Garmin.',
    supporters: (n: string, goal: string) =>
      `OpenAthlete działa bez reklam i inwestorów, dzięki swoim Supporterom: ${n} przy celu ${goal}.`,
    supportersLink: 'Dowiedz się więcej',
  },
  NL: {
    subject: (figure: string) => `Je week: ${figure}`,
    plannedFigure: (done: number, planned: number) =>
      `${done} van ${planned} geplande ${planned > 1 ? 'trainingen' : 'training'}`,
    sessions: (n: number) => (n === 1 ? '1 training' : `${n} trainingen`),
    elevation: (m: string) => `${m} hoogtemeters`,
    rest: 'een rustweek',
    preview: 'Afgelopen week, je vorm en wat er komt.',
    title: 'Je week',
    past: 'Afgelopen week',
    labels: {
      sessions: 'Trainingen',
      time: 'Tijd',
      distance: 'Afstand',
      elevation: 'Hoogtemeters',
    },
    doneOf: (done: string, planned: string) => `${done} van ${planned}`,
    nothingDone: 'Afgelopen week is er geen training geregistreerd.',
    load: (trimp: string) => `Belasting: ${trimp} TRIMP.`,
    more: (pct: string) => `${pct}% meer dan de week ervoor.`,
    less: (pct: string) => `${pct}% minder dan de week ervoor.`,
    same: 'Ongeveer evenveel als de week ervoor.',
    timeMore: (pct: string) => `${pct}% meer trainingstijd dan de week ervoor.`,
    timeLess: (pct: string) =>
      `${pct}% minder trainingstijd dan de week ervoor.`,
    form: 'Je vorm',
    fitness: 'Fitheid (CTL)',
    fatigue: 'Vermoeidheid (ATL)',
    status: {
      fatigue: 'Hoge vermoeidheid',
      balanced: 'In balans',
      fresh: 'Heel fris',
    },
    tsb: (status: string, tsb: string) => `${status}: vorm (TSB) op ${tsb}.`,
    trend: {
      up: 'Vermoeidheid stijgt: het was een zware week.',
      down: 'Vermoeidheid daalt: het was een lichtere week.',
      stable: 'Vermoeidheid stabiel ten opzichte van de week ervoor.',
    },
    next: 'De komende week',
    nothingPlanned: 'Nog niets gepland.',
    race: (name: string, days: number) =>
      days === 1
        ? `Volgende wedstrijd: ${name}, morgen.`
        : `Volgende wedstrijd: ${name}, over ${days} dagen.`,
    see: 'Mijn week bekijken',
    plan: 'Plan je week',
    garmin: 'Inzichten deels afgeleid van gegevens van Garmin-apparaten.',
    supporters: (n: string, goal: string) =>
      `OpenAthlete draait zonder advertenties of investeerders, dankzij zijn Supporters: ${n} van een doel van ${goal}.`,
    supportersLink: 'Meer weten',
  },
} satisfies Record<EmailLanguage, unknown>;

/** Same thresholds as the app (apps/web/src/utils/training-form.ts) */
const TSB_OVERREACHING = -20;
const TSB_DETRAINING = 25;
/** Below this change, two weeks count as the same */
const SAME_WEEK_THRESHOLD = 0.1;
/** ATL change over the week, in points, that counts as a trend */
const TREND_POINTS = 3;
const MAX_SESSIONS_SHOWN = 10;

export function formStatus(tsb: number): FormStatus {
  if (tsb < TSB_OVERREACHING) return 'fatigue';
  if (tsb > TSB_DETRAINING) return 'fresh';
  return 'balanced';
}

export function fatigueTrend(atl: number, atlWeekBefore: number): Trend {
  const change = atl - atlWeekBefore;
  if (change >= TREND_POINTS) return 'up';
  if (change <= -TREND_POINTS) return 'down';
  return 'stable';
}

export interface WeeklyTotals {
  count: number;
  distance: number;
  movingTime: number;
  elevationGain: number;
  /** TRIMP of the week's activities */
  trimp: number;
}

export interface WeeklyRecapProps extends LifecycleEmailProps {
  past: WeeklyTotals & {
    /** Sessions planned in the week, and how many of them were done */
    planned: number;
    done: number;
  };
  previous: WeeklyTotals;
  /** At the end of the past week; null without any load computed */
  form: { ctl: number; atl: number; atlWeekBefore: number } | null;
  /** The week to come, in local dates */
  upcoming: { date: string; name: string; duration: number | null }[];
  nextRace: { name: string; daysLeft: number } | null;
  calendarUrl: string;
  /** Garmin data feeds the figures: its attribution is required */
  garmin: boolean;
  /** The Supporter bar, for non-Supporters who asked for news, some weeks */
  supporters: { count: number; goal: number; url: string } | null;
  /**
   * One sentence of AI analysis, for Supporters, on its own budget. Not
   * built yet; it must never read Strava data (Strava's API terms).
   */
  insight?: string | null;
}

function signed(value: number) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/** The figure of the week, for the subject */
function figure(props: WeeklyRecapProps) {
  const { language, past } = props;
  const t = translations[language];
  if (past.planned > 0) return t.plannedFigure(past.done, past.planned);
  if (past.count === 0) return t.rest;
  const parts = [t.sessions(past.count)];
  if (past.distance >= 1000) parts.push(formatKm(language, past.distance));
  if (past.elevationGain >= 50) {
    parts.push(t.elevation(formatNumber(language, past.elevationGain)));
  }
  return parts.join(', ');
}

/** The week against the one before: on load when both have one, else time */
function comparison(props: WeeklyRecapProps): string | null {
  const { language, past, previous } = props;
  const t = translations[language];
  const byLoad = past.trimp > 0 && previous.trimp > 0;
  const [now, before] = byLoad
    ? [past.trimp, previous.trimp]
    : [past.movingTime, previous.movingTime];
  if (now <= 0 || before <= 0) return null;
  const change = now / before - 1;
  if (Math.abs(change) < SAME_WEEK_THRESHOLD) return t.same;
  const pct = formatNumber(language, Math.abs(change) * 100);
  if (byLoad) return change > 0 ? t.more(pct) : t.less(pct);
  return change > 0 ? t.timeMore(pct) : t.timeLess(pct);
}

export function buildWeeklyRecapEmail(props: WeeklyRecapProps): LifecycleEmail {
  const { language, past } = props;
  const t = translations[language];
  const subject = t.subject(figure(props));

  const pastBlocks: Block[] = [subheading(t.past)];
  if (past.count === 0 && past.planned === 0) {
    pastBlocks.push(paragraph(t.nothingDone));
  } else {
    pastBlocks.push(
      stats([
        {
          label: t.labels.sessions,
          value:
            past.planned > 0
              ? t.doneOf(
                  formatNumber(language, past.done),
                  formatNumber(language, past.planned),
                )
              : formatNumber(language, past.count),
        },
        {
          label: t.labels.time,
          value: formatDuration(language, past.movingTime),
        },
      ]),
    );
    if (past.distance >= 1000 || past.elevationGain > 0) {
      pastBlocks.push(
        stats([
          {
            label: t.labels.distance,
            value: formatKm(language, past.distance),
          },
          {
            label: t.labels.elevation,
            value: `${formatNumber(language, past.elevationGain)} m`,
          },
        ]),
      );
    }
    const compared = comparison(props);
    const load =
      past.trimp > 0 ? t.load(formatNumber(language, past.trimp)) : null;
    const line = [load, compared].filter(Boolean).join(' ');
    if (line) pastBlocks.push(paragraph(line));
  }
  if (props.insight) pastBlocks.push(paragraph(props.insight));

  const formBlocks: Block[] = [];
  if (props.form && props.form.ctl >= 1) {
    const { ctl, atl, atlWeekBefore } = props.form;
    formBlocks.push(
      subheading(t.form),
      stats([
        { label: t.fitness, value: formatNumber(language, ctl) },
        { label: t.fatigue, value: formatNumber(language, atl) },
      ]),
      paragraph(
        `${t.tsb(t.status[formStatus(ctl - atl)], signed(ctl - atl))} ${t.trend[fatigueTrend(atl, atlWeekBefore)]}`,
      ),
    );
  }

  const planned = props.upcoming.length > 0;
  const nextBlocks: Block[] = [subheading(t.next)];
  if (planned) {
    nextBlocks.push(
      facts(
        props.upcoming.slice(0, MAX_SESSIONS_SHOWN).map((session) => ({
          label: capitalize(formatWeekday(language, session.date)),
          value:
            session.duration && session.duration > 0
              ? `${session.name} · ${formatDuration(language, session.duration)}`
              : session.name,
        })),
      ),
    );
  } else {
    nextBlocks.push(paragraph(t.nothingPlanned));
  }
  if (props.nextRace) {
    nextBlocks.push(
      paragraph(t.race(props.nextRace.name, props.nextRace.daysLeft)),
    );
  }

  const footBlocks: Block[] = [];
  if (props.garmin) footBlocks.push(note(t.garmin));
  if (props.supporters) {
    const { count, goal, url } = props.supporters;
    footBlocks.push(
      progress({
        value: count,
        goal,
        caption: t.supporters(
          formatNumber(language, count),
          formatNumber(language, goal),
        ),
      }),
      note({ href: url, label: t.supportersLink }),
    );
  }

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
        ...pastBlocks,
        ...formBlocks,
        ...nextBlocks,
        // Nothing planned: the one button asks to plan, not to look
        button({ href: props.calendarUrl, label: planned ? t.see : t.plan }),
        signature(props.signature),
        ...footBlocks,
      ],
    }),
  };
}
