import { Language } from 'src/common/constants/languages.constant';

import type { PushNotificationTranslation } from './translations';

type Copy = {
  title: (athlete: string) => string;
  /** "Resting HR 62, above 58" */
  above: (metric: string, value: string, bound: string) => string;
  below: (metric: string, value: string, bound: string) => string;
  metrics: Record<string, string>;
};

const translations: Record<Language, Copy> = {
  [Language.FR]: {
    title: (athlete) => `${athlete} : métrique à surveiller`,
    above: (metric, value, bound) =>
      `${metric} ${value}, au-dessus de ${bound}`,
    below: (metric, value, bound) =>
      `${metric} ${value}, en dessous de ${bound}`,
    metrics: {
      HR_REST: 'FC de repos',
      HRV_LAST_NIGHT_AVG: 'VFC de la nuit',
      SLEEP_DURATION: 'Sommeil',
      SLEEP_SCORE: 'Score de sommeil',
      WEIGHT: 'Poids',
    },
  },
  [Language.EN]: {
    title: (athlete) => `${athlete}: a metric to look at`,
    above: (metric, value, bound) => `${metric} ${value}, above ${bound}`,
    below: (metric, value, bound) => `${metric} ${value}, below ${bound}`,
    metrics: {
      HR_REST: 'Resting HR',
      HRV_LAST_NIGHT_AVG: 'Overnight HRV',
      SLEEP_DURATION: 'Sleep',
      SLEEP_SCORE: 'Sleep score',
      WEIGHT: 'Weight',
    },
  },
  [Language.IT]: {
    title: (athlete) => `${athlete}: una metrica da controllare`,
    above: (metric, value, bound) => `${metric} ${value}, sopra ${bound}`,
    below: (metric, value, bound) => `${metric} ${value}, sotto ${bound}`,
    metrics: {
      HR_REST: 'FC a riposo',
      HRV_LAST_NIGHT_AVG: 'HRV notturna',
      SLEEP_DURATION: 'Sonno',
      SLEEP_SCORE: 'Punteggio del sonno',
      WEIGHT: 'Peso',
    },
  },
  [Language.ES]: {
    title: (athlete) => `${athlete}: una métrica que revisar`,
    above: (metric, value, bound) =>
      `${metric} ${value}, por encima de ${bound}`,
    below: (metric, value, bound) =>
      `${metric} ${value}, por debajo de ${bound}`,
    metrics: {
      HR_REST: 'FC en reposo',
      HRV_LAST_NIGHT_AVG: 'VFC nocturna',
      SLEEP_DURATION: 'Sueño',
      SLEEP_SCORE: 'Puntuación de sueño',
      WEIGHT: 'Peso',
    },
  },
  [Language.PT_BR]: {
    title: (athlete) => `${athlete}: uma métrica para olhar`,
    above: (metric, value, bound) => `${metric} ${value}, acima de ${bound}`,
    below: (metric, value, bound) => `${metric} ${value}, abaixo de ${bound}`,
    metrics: {
      HR_REST: 'FC de repouso',
      HRV_LAST_NIGHT_AVG: 'VFC noturna',
      SLEEP_DURATION: 'Sono',
      SLEEP_SCORE: 'Pontuação do sono',
      WEIGHT: 'Peso',
    },
  },
  [Language.DE]: {
    title: (athlete) => `${athlete}: ein Wert zum Ansehen`,
    above: (metric, value, bound) => `${metric} ${value}, über ${bound}`,
    below: (metric, value, bound) => `${metric} ${value}, unter ${bound}`,
    metrics: {
      HR_REST: 'Ruhepuls',
      HRV_LAST_NIGHT_AVG: 'HRV der Nacht',
      SLEEP_DURATION: 'Schlaf',
      SLEEP_SCORE: 'Schlafwert',
      WEIGHT: 'Gewicht',
    },
  },
};

const round = (value: number) =>
  String(Math.round(value * 10) / 10).replace(/\.0$/, '');

/** A coach's notice that an athlete's metric went past their bounds. */
export function metricThresholdNotification(
  language: Language,
  athleteName: string,
  metricType: string,
  value: number,
  bounds: { min: number | null; max: number | null },
): PushNotificationTranslation {
  const copy = translations[language] ?? translations[Language.EN];
  const metric = copy.metrics[metricType] ?? metricType;
  const above = bounds.max !== null && value > bounds.max;
  return {
    title: copy.title(athleteName),
    body: above
      ? copy.above(metric, round(value), round(bounds.max!))
      : copy.below(metric, round(value), round(bounds.min ?? value)),
  };
}
