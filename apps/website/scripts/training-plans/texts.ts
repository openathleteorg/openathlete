/**
 * Session, week, block and plan texts of the generated running plans, written
 * natively in each language (not translated word for word).
 */
import type { RunningDistance } from '../../src/lib/training-plans/specs';

export const PLAN_LOCALES = ['en', 'fr', 'es', 'it', 'pt-br', 'de'] as const;
export type PlanLocale = (typeof PLAN_LOCALES)[number];

export type PhaseKey = 'base' | 'build' | 'specific' | 'taper';
export type WeekKind =
  'base' | 'build' | 'light' | 'peak' | 'specific' | 'taper' | 'race';

export type SessionKind =
  | 'easy'
  | 'easyStrides'
  | 'recovery'
  | 'long'
  | 'longFinish'
  | 'longGoal'
  | 'fartlek'
  | 'vmaShort'
  | 'vma'
  | 'vmaLong'
  | 'threshold'
  | 'tempo'
  | 'goalPace'
  | 'sharpen'
  | 'race';

export type StepKey =
  | 'warmup'
  | 'cooldown'
  | 'easy'
  | 'jog'
  | 'stride'
  | 'fast'
  | 'threshold'
  | 'tempo'
  | 'goal';

/** Pieces already rendered in the reader's language. */
export interface DescParts {
  /** Warm-up and cool-down durations, "15 min". */
  wu: string;
  cd: string;
  /** Main or total duration. */
  dur: string;
  /** Bare intensity, "62–70% VMA", for parentheses. */
  pct: string;
  /** Intensity with its preposition, "at 95–100% VMA". */
  at: string;
  reps: number;
  /** One rep: "800 m", "8 min". */
  rep: string;
  /** Recovery between reps. */
  rec: string;
  /** Easy running between blocks of a long run. */
  between: string;
}

export interface PlanTexts {
  vma: string;
  decimal: string;
  /** "62–70% VMA" */
  pct(lo: number, hi: number): string;
  /** "at 62–70% VMA" */
  atPct(lo: number, hi: number): string;
  /** "at marathon pace (5:41/km)" */
  atGoal(distance: RunningDistance, pace: string): string;
  hm(minutes: number): string;
  sec(seconds: number): string;
  distance: Record<
    RunningDistance,
    { title: string; lower: string; article: string }
  >;
  goalPaceName: Record<RunningDistance, string>;
  steps: Record<StepKey, string>;
  names: Record<Exclude<SessionKind, 'goalPace' | 'race'>, string>;
  raceName(distance: RunningDistance): string;
  desc: Record<SessionKind, (p: DescParts) => string>;
  /** Added to the description of marathon and half long runs from the specific block on. */
  fuelTip: string;
  weekTheme: Record<WeekKind, string>;
  cycleName(phase: PhaseKey, distance: RunningDistance): string;
  cycleDesc(
    phase: PhaseKey,
    distance: RunningDistance,
    lightWeeks: number[],
  ): string;
  planName(d: RunningDistance, time: string, weeks: number): string;
  planGoal(d: RunningDistance, time: string): string;
  planDesc(v: {
    d: RunningDistance;
    time: string;
    pace: string;
    weeks: number;
    runs: number;
    vma: string;
    firstKm: number;
    peakKm: number;
    longest: string;
  }): string;
}

const hmFormat = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${h}h${String(min).padStart(2, '0')}`;
};

const secFormat = (seconds: number, minSep: string, secUnit: string) => {
  if (seconds < 120 && seconds % 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${min} min${minSep}${s}${secUnit}` : `${min} min`;
};

/** "week 4", "weeks 4 and 8" */
const list = (weeks: number[], and: string) =>
  weeks.length <= 1
    ? String(weeks[0] ?? '')
    : `${weeks.slice(0, -1).join(', ')} ${and} ${weeks[weeks.length - 1]}`;

const en: PlanTexts = {
  vma: 'VMA',
  decimal: '.',
  pct: (lo, hi) => `${lo}–${hi}% VMA`,
  atPct: (lo, hi) => `at ${lo}–${hi}% VMA`,
  atGoal: (d, pace) => `at ${en.goalPaceName[d]} (${pace})`,
  hm: hmFormat,
  sec: (s) => secFormat(s, ' ', ' s'),
  distance: {
    '10k': { title: '10K', lower: '10K', article: 'a 10K' },
    'half-marathon': {
      title: 'Half marathon',
      lower: 'half marathon',
      article: 'a half marathon',
    },
    marathon: { title: 'Marathon', lower: 'marathon', article: 'a marathon' },
  },
  goalPaceName: {
    '10k': '10K pace',
    'half-marathon': 'half marathon pace',
    marathon: 'marathon pace',
  },
  steps: {
    warmup: 'Warm-up',
    cooldown: 'Cool-down',
    easy: 'Easy',
    jog: 'Jog',
    stride: 'Stride',
    fast: 'Fast',
    threshold: 'Threshold',
    tempo: 'Tempo',
    goal: 'Goal pace',
  },
  names: {
    easy: 'Easy run',
    easyStrides: 'Easy run + strides',
    recovery: 'Recovery run',
    long: 'Long run',
    longFinish: 'Long run, fast finish',
    longGoal: 'Long run with marathon pace',
    fartlek: 'Fartlek',
    vmaShort: '30/30 intervals',
    vma: 'VMA intervals',
    vmaLong: 'Long intervals',
    threshold: 'Threshold',
    tempo: 'Tempo run',
    sharpen: 'Easy run with goal pace',
  },
  raceName: (d) => `Race day: ${en.distance[d].lower}`,
  desc: {
    easy: (p) => `${p.dur} easy (${p.pct}).`,
    easyStrides: (p) =>
      `${p.dur} easy (${p.pct}), then ${p.reps} strides of 20 s: fast but relaxed, walk back between them.`,
    recovery: (p) => `${p.dur} very easy (${p.pct}). Slower is fine.`,
    long: (p) => `${p.dur} at an easy, even pace (${p.pct}).`,
    longFinish: (p) =>
      `${p.dur} in all: easy (${p.pct}), then the last ${p.rep} ${p.at}.`,
    longGoal: (p) =>
      `${p.dur} in all, with ${p.reps} × ${p.rep} ${p.at} and ${p.between} easy between them. The rest easy (${p.pct}).`,
    fartlek: (p) =>
      `${p.wu} warm-up, ${p.reps} × (${p.rep} fast ${p.at} / ${p.rec} easy), ${p.cd} cool-down.`,
    vmaShort: (p) =>
      `${p.wu} warm-up, ${p.reps} × (30 s ${p.at} / 30 s jog), ${p.cd} cool-down.`,
    vma: (p) =>
      `${p.wu} warm-up, ${p.reps} × ${p.rep} ${p.at} with ${p.rec} jog between, ${p.cd} cool-down.`,
    vmaLong: (p) =>
      `${p.wu} warm-up, ${p.reps} × ${p.rep} ${p.at} with ${p.rec} jog between, ${p.cd} cool-down.`,
    threshold: (p) =>
      p.reps > 1
        ? `${p.wu} warm-up, ${p.reps} × ${p.rep} at threshold (${p.pct}) with ${p.rec} jog between, ${p.cd} cool-down.`
        : `${p.wu} warm-up, ${p.rep} at threshold (${p.pct}), ${p.cd} cool-down.`,
    tempo: (p) =>
      `${p.wu} warm-up, ${p.dur} steady (${p.pct}), ${p.cd} cool-down.`,
    goalPace: (p) =>
      `${p.wu} warm-up, ${p.reps} × ${p.rep} ${p.at} with ${p.rec} jog between, ${p.cd} cool-down.`,
    sharpen: (p) =>
      `${p.dur} easy, with ${p.reps} × ${p.rep} ${p.at} in the second half.`,
    race: (p) =>
      `Race day. Settle ${p.at} from the start and hold it; only speed up in the last kilometres if your legs say yes.`,
  },
  fuelTip: 'Drink and take your race-day gels on the way, to test them.',
  weekTheme: {
    base: 'Base',
    build: 'Build',
    light: 'Easier week',
    peak: 'Biggest week',
    specific: 'Race pace',
    taper: 'Taper',
    race: 'Race week',
  },
  cycleName: (phase, d) =>
    ({
      base: 'Base',
      build: 'Build',
      specific:
        d === '10k' ? 'Speed and 10K pace' : `${en.distance[d].title} pace`,
      taper: 'Taper',
    })[phase],
  cycleDesc: (phase, d, light) => {
    const lighter = light.length
      ? ` Week${light.length > 1 ? 's' : ''} ${list(light, 'and')} ${light.length > 1 ? 'are' : 'is'} lighter, to absorb the work.`
      : '';
    switch (phase) {
      case 'base':
        return `Easy volume, short fast reps and strides. The long run grows a little each week.${lighter}`;
      case 'build':
        return `VMA intervals and threshold work, longer long runs.${lighter}`;
      case 'specific':
        if (d === '10k')
          return `VMA intervals and reps at 10K pace: the hardest block of the plan.${lighter}`;
        if (d === 'half-marathon')
          return `Half marathon pace in the midweek session and at the end of the long runs.${lighter}`;
        return `Marathon pace in the long runs and in midweek blocks: the biggest weeks of the plan.${lighter}`;
      case 'taper':
        return 'Less volume, a little intensity to stay sharp, and you start the race fresh.';
    }
  },
  planName: (d, time, weeks) =>
    `${en.distance[d].title} in ${time}: ${weeks}-week plan`,
  planGoal: (d, time) => `Run ${en.distance[d].article} in ${time}`,
  planDesc: (v) =>
    `${v.weeks} weeks, ${v.runs} runs a week, to run ${en.distance[v.d].article} in ${v.time} (${v.pace}/km). Written for a VMA around ${v.vma} km/h. Week 1 is about ${v.firstKm} km; the biggest week reaches ${v.peakKm} km and the longest run lasts ${v.longest}. Every session has its targets: a share of VMA for easy runs and intervals, your goal pace for race-pace work.`,
};

// French typography: no-break spaces before : ; and %
const fr: PlanTexts = {
  vma: 'VMA',
  decimal: ',',
  pct: (lo, hi) => `${lo}–${hi}\u00a0% VMA`,
  atPct: (lo, hi) => `à ${lo}–${hi}\u00a0% VMA`,
  atGoal: (d, pace) => `à ${fr.goalPaceName[d]} (${pace})`,
  hm: hmFormat,
  sec: (s) => secFormat(s, ' ', ''),
  distance: {
    '10k': { title: '10 km', lower: '10 km', article: 'un 10 km' },
    'half-marathon': {
      title: 'Semi-marathon',
      lower: 'semi-marathon',
      article: 'un semi-marathon',
    },
    marathon: { title: 'Marathon', lower: 'marathon', article: 'un marathon' },
  },
  goalPaceName: {
    '10k': 'allure spécifique 10 km',
    'half-marathon': 'allure spécifique semi',
    marathon: 'allure spécifique marathon',
  },
  steps: {
    warmup: 'Échauffement',
    cooldown: 'Retour au calme',
    easy: 'Endurance',
    jog: 'Récup trot',
    stride: 'Ligne droite',
    fast: 'Vite',
    threshold: 'Seuil',
    tempo: 'Allure soutenue',
    goal: 'Allure spécifique',
  },
  names: {
    easy: 'Footing',
    easyStrides: 'Footing + lignes droites',
    recovery: 'Footing de récupération',
    long: 'Sortie longue',
    longFinish: 'Sortie longue, fin rapide',
    longGoal: 'Sortie longue avec allure spécifique',
    fartlek: 'Fartlek',
    vmaShort: 'Fractionné 30/30',
    vma: 'Fractionné VMA',
    vmaLong: 'VMA longue',
    threshold: 'Seuil',
    tempo: 'Allure soutenue',
    sharpen: 'Footing + rappel d’allure',
  },
  raceName: (d) => `Jour J\u00a0: ${fr.distance[d].lower}`,
  desc: {
    easy: (p) => `${p.dur} en endurance fondamentale (${p.pct}).`,
    easyStrides: (p) =>
      `${p.dur} en endurance fondamentale (${p.pct}), puis ${p.reps} lignes droites de 20 s, rapides mais relâchées, retour en marchant.`,
    recovery: (p) =>
      `${p.dur} très tranquille (${p.pct}), pour récupérer. Plus lent, c’est bien aussi.`,
    long: (p) => `${p.dur} à allure facile et régulière (${p.pct}).`,
    longFinish: (p) =>
      `${p.dur} au total\u00a0: endurance fondamentale (${p.pct}), puis ${p.rep} ${p.at} pour finir.`,
    longGoal: (p) =>
      `${p.dur} au total, dont ${p.reps} × ${p.rep} ${p.at}, avec ${p.between} en endurance entre les blocs. Le reste en endurance fondamentale (${p.pct}).`,
    fartlek: (p) =>
      `${p.wu} d’échauffement, ${p.reps} × (${p.rep} vite ${p.at} / ${p.rec} trot), ${p.cd} de retour au calme.`,
    vmaShort: (p) =>
      `${p.wu} d’échauffement, ${p.reps} × (30 s ${p.at} / 30 s trot), ${p.cd} de retour au calme.`,
    vma: (p) =>
      `${p.wu} d’échauffement, ${p.reps} × ${p.rep} ${p.at}, récup ${p.rec} trot, ${p.cd} de retour au calme.`,
    vmaLong: (p) =>
      `${p.wu} d’échauffement, ${p.reps} × ${p.rep} ${p.at}, récup ${p.rec} trot, ${p.cd} de retour au calme.`,
    threshold: (p) =>
      p.reps > 1
        ? `${p.wu} d’échauffement, ${p.reps} × ${p.rep} au seuil (${p.pct}), récup ${p.rec} trot, ${p.cd} de retour au calme.`
        : `${p.wu} d’échauffement, ${p.rep} au seuil (${p.pct}), ${p.cd} de retour au calme.`,
    tempo: (p) =>
      `${p.wu} d’échauffement, ${p.dur} à allure soutenue (${p.pct}), ${p.cd} de retour au calme.`,
    goalPace: (p) =>
      `${p.wu} d’échauffement, ${p.reps} × ${p.rep} ${p.at}, récup ${p.rec} trot, ${p.cd} de retour au calme.`,
    sharpen: (p) =>
      `${p.dur} en endurance fondamentale, avec ${p.reps} × ${p.rep} ${p.at} dans la seconde moitié.`,
    race: (p) =>
      `Jour de course. Calez-vous ${p.at} dès le départ et tenez-la\u00a0; n’accélérez que dans les derniers kilomètres si les jambes répondent.`,
  },
  fuelTip: 'Buvez et prenez vos gels du jour J en route, pour les tester.',
  weekTheme: {
    base: 'Foncier',
    build: 'Développement',
    light: 'Semaine allégée',
    peak: 'Semaine la plus chargée',
    specific: 'Spécifique',
    taper: 'Affûtage',
    race: 'Semaine de course',
  },
  cycleName: (phase, d) =>
    ({
      base: 'Préparation générale',
      build: 'Développement',
      specific:
        d === '10k'
          ? 'VMA et allure 10 km'
          : d === 'half-marathon'
            ? 'Spécifique semi'
            : 'Spécifique marathon',
      taper: 'Affûtage',
    })[phase],
  cycleDesc: (phase, d, light) => {
    const lighter = light.length
      ? ` ${light.length > 1 ? 'Les semaines' : 'La semaine'} ${list(light, 'et')} ${light.length > 1 ? 'sont allégées' : 'est allégée'} pour assimiler le travail.`
      : '';
    switch (phase) {
      case 'base':
        return `Du volume facile, du fractionné court et des lignes droites. La sortie longue s’allonge un peu chaque semaine.${lighter}`;
      case 'build':
        return `Fractionné VMA et travail au seuil, sorties longues plus longues.${lighter}`;
      case 'specific':
        if (d === '10k')
          return `Fractionné VMA et répétitions à allure 10 km\u00a0: le bloc le plus dur du plan.${lighter}`;
        if (d === 'half-marathon')
          return `L’allure semi en séance de semaine et en fin de sortie longue.${lighter}`;
        return `L’allure marathon dans les sorties longues et en séance de semaine\u00a0: les plus grosses semaines du plan.${lighter}`;
      case 'taper':
        return 'Moins de volume, un peu d’intensité pour garder du jus\u00a0: vous arrivez frais au départ.';
    }
  },
  planName: (d, time, weeks) =>
    `Plan ${fr.distance[d].lower} en ${time}\u00a0: ${weeks} semaines`,
  planGoal: (d, time) => `Courir ${fr.distance[d].article} en ${time}`,
  planDesc: (v) =>
    `${v.weeks} semaines, ${v.runs} sorties par semaine, pour courir ${fr.distance[v.d].article} en ${v.time} (${v.pace}/km). Écrit pour une VMA autour de ${v.vma} km/h. La première semaine fait environ ${v.firstKm} km\u00a0; la plus chargée atteint ${v.peakKm} km et la sortie la plus longue dure ${v.longest}. Chaque séance a ses cibles\u00a0: un pourcentage de VMA pour l’endurance et le fractionné, votre allure objectif pour le travail spécifique.`,
};

const es: PlanTexts = {
  vma: 'VAM',
  decimal: ',',
  pct: (lo, hi) => `${lo}–${hi} % de la VAM`,
  atPct: (lo, hi) => `al ${lo}–${hi} % de la VAM`,
  atGoal: (d, pace) => `a ${es.goalPaceName[d]} (${pace})`,
  hm: hmFormat,
  sec: (s) => secFormat(s, ' ', ' s'),
  distance: {
    '10k': { title: '10K', lower: '10K', article: 'un 10K' },
    'half-marathon': {
      title: 'Medio maratón',
      lower: 'medio maratón',
      article: 'un medio maratón',
    },
    marathon: { title: 'Maratón', lower: 'maratón', article: 'un maratón' },
  },
  goalPaceName: {
    '10k': 'ritmo de 10K',
    'half-marathon': 'ritmo de media',
    marathon: 'ritmo de maratón',
  },
  steps: {
    warmup: 'Calentamiento',
    cooldown: 'Vuelta a la calma',
    easy: 'Suave',
    jog: 'Trote',
    stride: 'Recta',
    fast: 'Rápido',
    threshold: 'Umbral',
    tempo: 'Ritmo sostenido',
    goal: 'Ritmo de carrera',
  },
  names: {
    easy: 'Rodaje suave',
    easyStrides: 'Rodaje + rectas',
    recovery: 'Rodaje regenerativo',
    long: 'Tirada larga',
    longFinish: 'Tirada larga con final rápido',
    longGoal: 'Tirada larga con ritmo de maratón',
    fartlek: 'Fartlek',
    vmaShort: 'Series 30/30',
    vma: 'Series de VAM',
    vmaLong: 'Series largas',
    threshold: 'Umbral',
    tempo: 'Ritmo sostenido',
    sharpen: 'Rodaje con ritmo de carrera',
  },
  raceName: (d) => `Día de carrera: ${es.distance[d].lower}`,
  desc: {
    easy: (p) => `${p.dur} de rodaje suave (${p.pct}).`,
    easyStrides: (p) =>
      `${p.dur} de rodaje suave (${p.pct}) y después ${p.reps} rectas de 20 s, rápidas pero sueltas, volviendo andando.`,
    recovery: (p) =>
      `${p.dur} muy suave (${p.pct}) para recuperar. Más lento también vale.`,
    long: (p) => `${p.dur} a ritmo cómodo y constante (${p.pct}).`,
    longFinish: (p) =>
      `${p.dur} en total: rodaje suave (${p.pct}) y los últimos ${p.rep} ${p.at}.`,
    longGoal: (p) =>
      `${p.dur} en total, con ${p.reps} × ${p.rep} ${p.at} y ${p.between} suave entre bloques. El resto suave (${p.pct}).`,
    fartlek: (p) =>
      `${p.wu} de calentamiento, ${p.reps} × (${p.rep} rápido ${p.at} / ${p.rec} suave), ${p.cd} de vuelta a la calma.`,
    vmaShort: (p) =>
      `${p.wu} de calentamiento, ${p.reps} × (30 s ${p.at} / 30 s trotando), ${p.cd} de vuelta a la calma.`,
    vma: (p) =>
      `${p.wu} de calentamiento, ${p.reps} × ${p.rep} ${p.at} con ${p.rec} de recuperación trotando, ${p.cd} de vuelta a la calma.`,
    vmaLong: (p) =>
      `${p.wu} de calentamiento, ${p.reps} × ${p.rep} ${p.at} con ${p.rec} de recuperación trotando, ${p.cd} de vuelta a la calma.`,
    threshold: (p) =>
      p.reps > 1
        ? `${p.wu} de calentamiento, ${p.reps} × ${p.rep} a umbral (${p.pct}) con ${p.rec} trotando, ${p.cd} de vuelta a la calma.`
        : `${p.wu} de calentamiento, ${p.rep} a umbral (${p.pct}), ${p.cd} de vuelta a la calma.`,
    tempo: (p) =>
      `${p.wu} de calentamiento, ${p.dur} a ritmo sostenido (${p.pct}), ${p.cd} de vuelta a la calma.`,
    goalPace: (p) =>
      `${p.wu} de calentamiento, ${p.reps} × ${p.rep} ${p.at} con ${p.rec} trotando, ${p.cd} de vuelta a la calma.`,
    sharpen: (p) =>
      `${p.dur} de rodaje suave, con ${p.reps} × ${p.rep} ${p.at} en la segunda mitad.`,
    race: (p) =>
      `Día de carrera. Ponte ${p.at} desde la salida y mantenlo; acelera solo en los últimos kilómetros si las piernas responden.`,
  },
  fuelTip:
    'Bebe y toma por el camino los geles del día de la carrera, para probarlos.',
  weekTheme: {
    base: 'Base',
    build: 'Desarrollo',
    light: 'Semana de descarga',
    peak: 'Semana de más volumen',
    specific: 'Ritmo de carrera',
    taper: 'Puesta a punto',
    race: 'Semana de carrera',
  },
  cycleName: (phase, d) =>
    ({
      base: 'Base',
      build: 'Desarrollo',
      specific:
        d === '10k'
          ? 'VAM y ritmo de 10K'
          : d === 'half-marathon'
            ? 'Específico de media'
            : 'Específico de maratón',
      taper: 'Puesta a punto',
    })[phase],
  cycleDesc: (phase, d, light) => {
    const lighter = light.length
      ? ` ${light.length > 1 ? 'Las semanas' : 'La semana'} ${list(light, 'y')} ${light.length > 1 ? 'son más suaves' : 'es más suave'} para asimilar el trabajo.`
      : '';
    switch (phase) {
      case 'base':
        return `Volumen suave, series cortas y rectas. La tirada larga crece un poco cada semana.${lighter}`;
      case 'build':
        return `Series de VAM y trabajo de umbral, tiradas largas más largas.${lighter}`;
      case 'specific':
        if (d === '10k')
          return `Series de VAM y repeticiones a ritmo de 10K: el bloque más duro del plan.${lighter}`;
        if (d === 'half-marathon')
          return `Ritmo de media en la sesión de mitad de semana y al final de las tiradas largas.${lighter}`;
        return `Ritmo de maratón en las tiradas largas y en bloques entre semana: las semanas más cargadas del plan.${lighter}`;
      case 'taper':
        return 'Menos volumen y algo de intensidad para mantener la chispa: llegas fresco a la salida.';
    }
  },
  planName: (d, time, weeks) =>
    `Plan de ${es.distance[d].lower} en ${time}: ${weeks} semanas`,
  planGoal: (d, time) => `Correr ${es.distance[d].article} en ${time}`,
  planDesc: (v) =>
    `${v.weeks} semanas, ${v.runs} salidas por semana, para correr ${es.distance[v.d].article} en ${v.time} (${v.pace}/km). Pensado para una VAM de unos ${v.vma} km/h. La primera semana suma unos ${v.firstKm} km; la más cargada llega a ${v.peakKm} km y la tirada más larga dura ${v.longest}. Cada sesión lleva sus objetivos: un porcentaje de la VAM para rodajes y series, tu ritmo objetivo para el trabajo a ritmo de carrera.`,
};

const it: PlanTexts = {
  vma: 'VAM',
  decimal: ',',
  pct: (lo, hi) => `${lo}–${hi}% della VAM`,
  atPct: (lo, hi) => `al ${lo}–${hi}% della VAM`,
  atGoal: (d, pace) => `a ${it.goalPaceName[d]} (${pace})`,
  hm: hmFormat,
  sec: (s) => secFormat(s, ' ', ' s'),
  distance: {
    '10k': { title: '10 km', lower: '10 km', article: 'una 10 km' },
    'half-marathon': {
      title: 'Mezza maratona',
      lower: 'mezza maratona',
      article: 'una mezza maratona',
    },
    marathon: { title: 'Maratona', lower: 'maratona', article: 'una maratona' },
  },
  goalPaceName: {
    '10k': 'ritmo gara 10 km',
    'half-marathon': 'ritmo gara mezza',
    marathon: 'ritmo gara maratona',
  },
  steps: {
    warmup: 'Riscaldamento',
    cooldown: 'Defaticamento',
    easy: 'Lento',
    jog: 'Recupero',
    stride: 'Allungo',
    fast: 'Veloce',
    threshold: 'Soglia',
    tempo: 'Medio',
    goal: 'Ritmo gara',
  },
  names: {
    easy: 'Lento',
    easyStrides: 'Lento + allunghi',
    recovery: 'Corsa rigenerante',
    long: 'Lungo',
    longFinish: 'Lungo con finale veloce',
    longGoal: 'Lungo con ritmo gara',
    fartlek: 'Fartlek',
    vmaShort: 'Ripetute 30/30',
    vma: 'Ripetute VAM',
    vmaLong: 'Ripetute lunghe',
    threshold: 'Soglia',
    tempo: 'Medio',
    sharpen: 'Lento con richiamo ritmo gara',
  },
  raceName: (d) => `Giorno di gara: ${it.distance[d].lower}`,
  desc: {
    easy: (p) => `${p.dur} di corsa lenta (${p.pct}).`,
    easyStrides: (p) =>
      `${p.dur} di corsa lenta (${p.pct}), poi ${p.reps} allunghi da 20 s, veloci ma sciolti, recupero camminando.`,
    recovery: (p) =>
      `${p.dur} molto piano (${p.pct}) per recuperare. Anche più piano va bene.`,
    long: (p) => `${p.dur} a ritmo facile e regolare (${p.pct}).`,
    longFinish: (p) =>
      `${p.dur} in totale: corsa lenta (${p.pct}), poi gli ultimi ${p.rep} ${p.at}.`,
    longGoal: (p) =>
      `${p.dur} in totale, con ${p.reps} × ${p.rep} ${p.at} e ${p.between} lenti tra un blocco e l’altro. Il resto lento (${p.pct}).`,
    fartlek: (p) =>
      `${p.wu} di riscaldamento, ${p.reps} × (${p.rep} veloce ${p.at} / ${p.rec} piano), ${p.cd} di defaticamento.`,
    vmaShort: (p) =>
      `${p.wu} di riscaldamento, ${p.reps} × (30 s ${p.at} / 30 s di corsa lenta), ${p.cd} di defaticamento.`,
    vma: (p) =>
      `${p.wu} di riscaldamento, ${p.reps} × ${p.rep} ${p.at} con ${p.rec} di recupero di corsa lenta, ${p.cd} di defaticamento.`,
    vmaLong: (p) =>
      `${p.wu} di riscaldamento, ${p.reps} × ${p.rep} ${p.at} con ${p.rec} di recupero di corsa lenta, ${p.cd} di defaticamento.`,
    threshold: (p) =>
      p.reps > 1
        ? `${p.wu} di riscaldamento, ${p.reps} × ${p.rep} a soglia (${p.pct}) con ${p.rec} di recupero, ${p.cd} di defaticamento.`
        : `${p.wu} di riscaldamento, ${p.rep} a soglia (${p.pct}), ${p.cd} di defaticamento.`,
    tempo: (p) =>
      `${p.wu} di riscaldamento, ${p.dur} di medio (${p.pct}), ${p.cd} di defaticamento.`,
    goalPace: (p) =>
      `${p.wu} di riscaldamento, ${p.reps} × ${p.rep} ${p.at} con ${p.rec} di recupero, ${p.cd} di defaticamento.`,
    sharpen: (p) =>
      `${p.dur} di corsa lenta, con ${p.reps} × ${p.rep} ${p.at} nella seconda metà.`,
    race: (p) =>
      `Giorno di gara. Mettiti ${p.at} dalla partenza e tienilo; accelera solo negli ultimi chilometri se le gambe rispondono.`,
  },
  fuelTip:
    'Bevi e prendi lungo il percorso i gel che userai in gara, per provarli.',
  weekTheme: {
    base: 'Base',
    build: 'Sviluppo',
    light: 'Settimana di scarico',
    peak: 'Settimana di picco',
    specific: 'Specifico',
    taper: 'Scarico pre-gara',
    race: 'Settimana di gara',
  },
  cycleName: (phase, d) =>
    ({
      base: 'Preparazione generale',
      build: 'Sviluppo',
      specific:
        d === '10k'
          ? 'VAM e ritmo gara 10 km'
          : d === 'half-marathon'
            ? 'Specifico mezza'
            : 'Specifico maratona',
      taper: 'Scarico pre-gara',
    })[phase],
  cycleDesc: (phase, d, light) => {
    const lighter = light.length
      ? ` ${light.length > 1 ? 'Le settimane' : 'La settimana'} ${list(light, 'e')} ${light.length > 1 ? 'sono più leggere' : 'è più leggera'}, per assorbire il lavoro.`
      : '';
    switch (phase) {
      case 'base':
        return `Volume facile, ripetute brevi e allunghi. Il lungo cresce un po’ ogni settimana.${lighter}`;
      case 'build':
        return `Ripetute VAM e lavoro a soglia, lunghi più lunghi.${lighter}`;
      case 'specific':
        if (d === '10k')
          return `Ripetute VAM e prove a ritmo gara 10 km: il blocco più duro della tabella.${lighter}`;
        if (d === 'half-marathon')
          return `Ritmo gara mezza nella seduta infrasettimanale e nel finale dei lunghi.${lighter}`;
        return `Ritmo gara maratona nei lunghi e nei blocchi infrasettimanali: le settimane più cariche della tabella.${lighter}`;
      case 'taper':
        return 'Meno volume, un po’ di intensità per restare brillanti: arrivi fresco alla partenza.';
    }
  },
  planName: (d, time, weeks) =>
    `Tabella ${it.distance[d].lower} in ${time}: ${weeks} settimane`,
  planGoal: (d, time) => `Correre ${it.distance[d].article} in ${time}`,
  planDesc: (v) =>
    `${v.weeks} settimane, ${v.runs} uscite a settimana, per correre ${it.distance[v.d].article} in ${v.time} (${v.pace}/km). Pensata per una VAM intorno a ${v.vma} km/h. La prima settimana vale circa ${v.firstKm} km; la più carica arriva a ${v.peakKm} km e il lungo più impegnativo dura ${v.longest}. Ogni seduta ha i suoi obiettivi: una percentuale della VAM per lenti e ripetute, il ritmo gara per il lavoro specifico.`,
};

const pt: PlanTexts = {
  vma: 'VAM',
  decimal: ',',
  pct: (lo, hi) => `${lo}–${hi}% da VAM`,
  atPct: (lo, hi) => `a ${lo}–${hi}% da VAM`,
  atGoal: (d, pace) => `no ${pt.goalPaceName[d]} (${pace})`,
  hm: hmFormat,
  sec: (s) => secFormat(s, ' ', ' s'),
  distance: {
    '10k': { title: '10 km', lower: '10 km', article: '10 km' },
    'half-marathon': {
      title: 'Meia maratona',
      lower: 'meia maratona',
      article: 'uma meia maratona',
    },
    marathon: { title: 'Maratona', lower: 'maratona', article: 'uma maratona' },
  },
  goalPaceName: {
    '10k': 'ritmo de prova dos 10 km',
    'half-marathon': 'ritmo de prova da meia',
    marathon: 'ritmo de prova da maratona',
  },
  steps: {
    warmup: 'Aquecimento',
    cooldown: 'Desaquecimento',
    easy: 'Leve',
    jog: 'Trote',
    stride: 'Aceleração',
    fast: 'Forte',
    threshold: 'Limiar',
    tempo: 'Ritmo forte',
    goal: 'Ritmo de prova',
  },
  names: {
    easy: 'Rodagem leve',
    easyStrides: 'Rodagem + acelerações',
    recovery: 'Regenerativo',
    long: 'Longão',
    longFinish: 'Longão com final forte',
    longGoal: 'Longão com ritmo de prova',
    fartlek: 'Fartlek',
    vmaShort: 'Tiros 30/30',
    vma: 'Tiros de VAM',
    vmaLong: 'Tiros longos',
    threshold: 'Limiar',
    tempo: 'Ritmo forte',
    sharpen: 'Rodagem com ritmo de prova',
  },
  raceName: (d) => `Dia de prova: ${pt.distance[d].lower}`,
  desc: {
    easy: (p) => `${p.dur} de rodagem leve (${p.pct}).`,
    easyStrides: (p) =>
      `${p.dur} de rodagem leve (${p.pct}) e depois ${p.reps} acelerações de 20 s, rápidas mas soltas, voltando caminhando.`,
    recovery: (p) =>
      `${p.dur} bem leve (${p.pct}) para recuperar. Mais devagar também vale.`,
    long: (p) => `${p.dur} em ritmo confortável e constante (${p.pct}).`,
    longFinish: (p) =>
      `${p.dur} no total: rodagem leve (${p.pct}) e os últimos ${p.rep} ${p.at}.`,
    longGoal: (p) =>
      `${p.dur} no total, com ${p.reps} × ${p.rep} ${p.at} e ${p.between} leves entre os blocos. O resto leve (${p.pct}).`,
    fartlek: (p) =>
      `${p.wu} de aquecimento, ${p.reps} × (${p.rep} forte ${p.at} / ${p.rec} leve), ${p.cd} de desaquecimento.`,
    vmaShort: (p) =>
      `${p.wu} de aquecimento, ${p.reps} × (30 s ${p.at} / 30 s trotando), ${p.cd} de desaquecimento.`,
    vma: (p) =>
      `${p.wu} de aquecimento, ${p.reps} × ${p.rep} ${p.at} com ${p.rec} de trote entre eles, ${p.cd} de desaquecimento.`,
    vmaLong: (p) =>
      `${p.wu} de aquecimento, ${p.reps} × ${p.rep} ${p.at} com ${p.rec} de trote entre eles, ${p.cd} de desaquecimento.`,
    threshold: (p) =>
      p.reps > 1
        ? `${p.wu} de aquecimento, ${p.reps} × ${p.rep} no limiar (${p.pct}) com ${p.rec} de trote, ${p.cd} de desaquecimento.`
        : `${p.wu} de aquecimento, ${p.rep} no limiar (${p.pct}), ${p.cd} de desaquecimento.`,
    tempo: (p) =>
      `${p.wu} de aquecimento, ${p.dur} em ritmo forte e controlado (${p.pct}), ${p.cd} de desaquecimento.`,
    goalPace: (p) =>
      `${p.wu} de aquecimento, ${p.reps} × ${p.rep} ${p.at} com ${p.rec} de trote, ${p.cd} de desaquecimento.`,
    sharpen: (p) =>
      `${p.dur} de rodagem leve, com ${p.reps} × ${p.rep} ${p.at} na segunda metade.`,
    race: (p) =>
      `Dia de prova. Largue ${p.at} desde o início e segure; acelere só nos últimos quilômetros se as pernas responderem.`,
  },
  fuelTip: 'Beba e tome no caminho os géis do dia da prova, para testá-los.',
  weekTheme: {
    base: 'Base',
    build: 'Desenvolvimento',
    light: 'Semana mais leve',
    peak: 'Semana de pico',
    specific: 'Ritmo de prova',
    taper: 'Polimento',
    race: 'Semana da prova',
  },
  cycleName: (phase, d) =>
    ({
      base: 'Base',
      build: 'Desenvolvimento',
      specific:
        d === '10k'
          ? 'VAM e ritmo de 10 km'
          : d === 'half-marathon'
            ? 'Específico de meia'
            : 'Específico de maratona',
      taper: 'Polimento',
    })[phase],
  cycleDesc: (phase, d, light) => {
    const lighter = light.length
      ? ` ${light.length > 1 ? 'As semanas' : 'A semana'} ${list(light, 'e')} ${light.length > 1 ? 'são mais leves' : 'é mais leve'}, para assimilar o treino.`
      : '';
    switch (phase) {
      case 'base':
        return `Volume leve, tiros curtos e acelerações. O longão cresce um pouco a cada semana.${lighter}`;
      case 'build':
        return `Tiros de VAM e treino de limiar, longões mais longos.${lighter}`;
      case 'specific':
        if (d === '10k')
          return `Tiros de VAM e repetições no ritmo dos 10 km: o bloco mais duro da planilha.${lighter}`;
        if (d === 'half-marathon')
          return `Ritmo de prova da meia no treino do meio da semana e no final dos longões.${lighter}`;
        return `Ritmo de prova da maratona nos longões e em blocos durante a semana: as semanas mais pesadas da planilha.${lighter}`;
      case 'taper':
        return 'Menos volume, um pouco de intensidade para manter o ritmo: você chega descansado à largada.';
    }
  },
  planName: (d, time, weeks) =>
    `Planilha de ${pt.distance[d].lower} em ${time}: ${weeks} semanas`,
  planGoal: (d, time) => `Correr ${pt.distance[d].article} em ${time}`,
  planDesc: (v) =>
    `${v.weeks} semanas, ${v.runs} treinos por semana, para correr ${pt.distance[v.d].article} em ${v.time} (${v.pace}/km). Pensada para uma VAM em torno de ${v.vma} km/h. A primeira semana tem cerca de ${v.firstKm} km; a mais pesada chega a ${v.peakKm} km e o maior longão dura ${v.longest}. Cada treino traz seus alvos: uma porcentagem da VAM para rodagens e tiros, o seu ritmo de prova para o trabalho específico.`,
};

// German: decimal comma, a space before % (DIN 5008), du-form
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const de: PlanTexts = {
  vma: 'VMA',
  decimal: ',',
  pct: (lo, hi) => `${lo}–${hi} % VMA`,
  atPct: (lo, hi) => `bei ${lo}–${hi} % VMA`,
  atGoal: (d, pace) => `im ${de.goalPaceName[d]} (${pace})`,
  hm: hmFormat,
  sec: (s) => secFormat(s, ' ', ' s'),
  distance: {
    '10k': { title: '10 km', lower: '10 km', article: '10 km' },
    'half-marathon': {
      title: 'Halbmarathon',
      lower: 'Halbmarathon',
      article: 'einen Halbmarathon',
    },
    marathon: {
      title: 'Marathon',
      lower: 'Marathon',
      article: 'einen Marathon',
    },
  },
  goalPaceName: {
    '10k': '10-km-Renntempo',
    'half-marathon': 'Halbmarathon-Renntempo',
    marathon: 'Marathon-Renntempo',
  },
  steps: {
    warmup: 'Einlaufen',
    cooldown: 'Auslaufen',
    easy: 'Locker',
    jog: 'Trabpause',
    stride: 'Steigerung',
    fast: 'Schnell',
    threshold: 'Schwelle',
    tempo: 'Tempo',
    goal: 'Renntempo',
  },
  names: {
    easy: 'Lockerer Dauerlauf',
    easyStrides: 'Lockerer Lauf + Steigerungen',
    recovery: 'Regenerationslauf',
    long: 'Langer Lauf',
    longFinish: 'Langer Lauf mit schnellem Finish',
    longGoal: 'Langer Lauf mit Marathontempo',
    fartlek: 'Fahrtspiel',
    vmaShort: '30/30-Intervalle',
    vma: 'VMA-Intervalle',
    vmaLong: 'Lange Intervalle',
    threshold: 'Schwellenlauf',
    tempo: 'Tempodauerlauf',
    sharpen: 'Lockerer Lauf mit Renntempo',
  },
  raceName: (d) => `Wettkampftag: ${de.distance[d].lower}`,
  desc: {
    easy: (p) => `${p.dur} locker (${p.pct}).`,
    easyStrides: (p) =>
      `${p.dur} locker (${p.pct}), danach ${p.reps} Steigerungen über 20 s: schnell, aber entspannt, zurück im Gehen.`,
    recovery: (p) =>
      `${p.dur} sehr locker (${p.pct}). Langsamer ist auch in Ordnung.`,
    long: (p) => `${p.dur} in lockerem, gleichmäßigem Tempo (${p.pct}).`,
    longFinish: (p) =>
      `${p.dur} insgesamt: locker (${p.pct}), dann die letzten ${p.rep} ${p.at}.`,
    longGoal: (p) =>
      `${p.dur} insgesamt, davon ${p.reps} × ${p.rep} ${p.at} mit ${p.between} locker dazwischen. Der Rest locker (${p.pct}).`,
    fartlek: (p) =>
      `${p.wu} Einlaufen, ${p.reps} × (${p.rep} schnell ${p.at} / ${p.rec} locker), ${p.cd} Auslaufen.`,
    vmaShort: (p) =>
      `${p.wu} Einlaufen, ${p.reps} × (30 s ${p.at} / 30 s Trab), ${p.cd} Auslaufen.`,
    vma: (p) =>
      `${p.wu} Einlaufen, ${p.reps} × ${p.rep} ${p.at} mit ${p.rec} Trabpause, ${p.cd} Auslaufen.`,
    vmaLong: (p) =>
      `${p.wu} Einlaufen, ${p.reps} × ${p.rep} ${p.at} mit ${p.rec} Trabpause, ${p.cd} Auslaufen.`,
    threshold: (p) =>
      p.reps > 1
        ? `${p.wu} Einlaufen, ${p.reps} × ${p.rep} an der Schwelle (${p.pct}) mit ${p.rec} Trabpause, ${p.cd} Auslaufen.`
        : `${p.wu} Einlaufen, ${p.rep} an der Schwelle (${p.pct}), ${p.cd} Auslaufen.`,
    tempo: (p) =>
      `${p.wu} Einlaufen, ${p.dur} zügig (${p.pct}), ${p.cd} Auslaufen.`,
    goalPace: (p) =>
      `${p.wu} Einlaufen, ${p.reps} × ${p.rep} ${p.at} mit ${p.rec} Trabpause, ${p.cd} Auslaufen.`,
    sharpen: (p) =>
      `${p.dur} locker, mit ${p.reps} × ${p.rep} ${p.at} in der zweiten Hälfte.`,
    race: (p) =>
      `Wettkampftag. Lauf vom Start weg ${p.at} und halte es; leg erst auf den letzten Kilometern zu, wenn die Beine mitspielen.`,
  },
  fuelTip:
    'Trink unterwegs und nimm deine Gels für den Wettkampftag, um sie zu testen.',
  weekTheme: {
    base: 'Grundlage',
    build: 'Aufbau',
    light: 'Entlastungswoche',
    peak: 'Umfangreichste Woche',
    specific: 'Renntempo',
    taper: 'Tapering',
    race: 'Wettkampfwoche',
  },
  cycleName: (phase, d) =>
    ({
      base: 'Grundlage',
      build: 'Aufbau',
      specific: d === '10k' ? 'VMA und 10-km-Renntempo' : de.goalPaceName[d],
      taper: 'Tapering',
    })[phase],
  cycleDesc: (phase, d, light) => {
    const lighter = light.length
      ? ` ${light.length > 1 ? 'Die Wochen' : 'Woche'} ${list(light, 'und')} ${light.length > 1 ? 'sind' : 'ist'} leichter, damit du das Training verarbeitest.`
      : '';
    switch (phase) {
      case 'base':
        return `Lockerer Umfang, kurze schnelle Wiederholungen und Steigerungen. Der lange Lauf wird jede Woche etwas länger.${lighter}`;
      case 'build':
        return `VMA-Intervalle und Schwellentraining, längere lange Läufe.${lighter}`;
      case 'specific':
        if (d === '10k')
          return `VMA-Intervalle und Wiederholungen im 10-km-Renntempo: der härteste Block des Plans.${lighter}`;
        if (d === 'half-marathon')
          return `Halbmarathon-Renntempo in der Einheit unter der Woche und am Ende der langen Läufe.${lighter}`;
        return `Marathon-Renntempo in den langen Läufen und in Blöcken unter der Woche: die umfangreichsten Wochen des Plans.${lighter}`;
      case 'taper':
        return 'Weniger Umfang, etwas Intensität, um spritzig zu bleiben: So gehst du frisch an den Start.';
    }
  },
  planName: (d, time, weeks) =>
    `${de.distance[d].title} in ${time}: Trainingsplan für ${weeks} Wochen`,
  planGoal: (d, time) => `${cap(de.distance[d].article)} in ${time} laufen`,
  planDesc: (v) =>
    `${v.weeks} Wochen, ${v.runs} Läufe pro Woche, um ${de.distance[v.d].article} in ${v.time} zu laufen (${v.pace}/km). Ausgelegt für eine VMA (maximale aerobe Geschwindigkeit) von etwa ${v.vma} km/h. Die erste Woche umfasst rund ${v.firstKm} km, die umfangreichste ${v.peakKm} km, und der längste Lauf dauert ${v.longest}. Jede Einheit hat ihre Zielvorgaben: ein Anteil der VMA für lockere Läufe und Intervalle, dein Zieltempo für die Einheiten im Renntempo.`,
};

export const TEXTS: Record<PlanLocale, PlanTexts> = {
  en,
  fr,
  es,
  it,
  'pt-br': pt,
  de,
};

/** Name of a goal-pace session: "Marathon pace", "Allure spécifique semi". */
export function goalPaceSessionName(t: PlanTexts, d: RunningDistance): string {
  const name = t.goalPaceName[d];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
