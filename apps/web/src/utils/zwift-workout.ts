import type { Event, WorkoutStep } from '@openathlete/shared';

export class ZwiftWorkoutError extends Error {
  constructor(public readonly reason: 'unsupported' | 'ftp') {
    super(reason);
  }
}
type ExportStep = Pick<
  WorkoutStep,
  | 'orderIndex'
  | 'stepType'
  | 'name'
  | 'notes'
  | 'durationType'
  | 'durationValue'
> & {
  targets: WorkoutStep['targets'];
  repeatBlock?: { repetitions: number; childSteps: ExportStep[] } | null;
};

const escapeXML = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[character]!,
  );
const unsupported = (): never => {
  throw new ZwiftWorkoutError('unsupported');
};
export const cyclingSports = new Set([
  'CYCLING',
  'VIRTUAL_RIDE',
  'GRAVEL_RIDE',
  'MOUNTAIN_BIKE_RIDE',
]);
export function localDayBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}
export function todaysZwiftWorkouts(events: Event[], now = new Date()) {
  const { start, end } = localDayBounds(now);
  return events
    .filter(
      (event) =>
        event.type === 'TRAINING' &&
        cyclingSports.has(event.sport) &&
        !event.relatedActivity &&
        new Date(event.startDate) >= start &&
        new Date(event.startDate) < end,
    )
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
}

/** Unsupported targets are rejected rather than exported as a different session. */
export function zwiftWorkoutXML(event: Event, ftp?: number): string {
  if (
    event.type !== 'TRAINING' ||
    !cyclingSports.has(event.sport) ||
    !event.workout?.steps.length
  )
    return unsupported();
  let count = 0;
  let total = 0;
  const number = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value) || value < 0)
      return unsupported();
    return value;
  };
  const midpoint = (target: {
    targetValue?: number | null;
    targetMin?: number | null;
    targetMax?: number | null;
  }) => {
    if (target.targetValue != null) return number(target.targetValue);
    const min = number(target.targetMin);
    const max = number(target.targetMax);
    if (max < min) return unsupported();
    return (min + max) / 2;
  };
  const steps = (input: ExportStep[], depth = 0): string[] => {
    if (depth > 8) return unsupported();
    return [...input]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .flatMap((step) => {
        if (++count > 600) return unsupported();
        if (step.stepType === 'REPEAT') {
          const block = step.repeatBlock;
          if (
            !block ||
            !Number.isInteger(block.repetitions) ||
            block.repetitions < 1 ||
            block.repetitions > 99 ||
            !block.childSteps?.length
          )
            return unsupported();
          return Array.from({ length: block.repetitions }, () =>
            steps(block.childSteps, depth + 1),
          ).flat();
        }
        const duration = number(step.durationValue);
        if (step.durationType !== 'TIME' || duration <= 0) return unsupported();
        total += duration;
        if (total > 6 * 3600) return unsupported();
        const targets = step.targets.filter(
          (target) => target.targetType !== 'OPEN',
        );
        if (
          targets.some(
            (target) => !['POWER', 'CADENCE'].includes(target.targetType),
          )
        )
          return unsupported();
        const powers = targets.filter(
          (target) => target.targetType === 'POWER',
        );
        const cadences = targets.filter(
          (target) => target.targetType === 'CADENCE',
        );
        if (powers.length > 1 || cadences.length > 1) return unsupported();
        let power: number | undefined;
        if (powers[0]) {
          const target = powers[0];
          const value = midpoint(target);
          if (target.metricType && target.metricType !== 'FTP_CYCLING')
            return unsupported();
          if (!target.metricType && (!ftp || !Number.isFinite(ftp) || ftp <= 0))
            throw new ZwiftWorkoutError('ftp');
          power = target.metricType ? value : value / ftp!;
          if (power > 5) return unsupported();
        }
        if (cadences[0]?.metricType) return unsupported();
        const cadence = cadences[0]
          ? ` Cadence="${midpoint(cadences[0])}"`
          : '';
        const label = [step.name, step.notes].filter(Boolean).join(' — ');
        const annotation = label
          ? `<textevent timeoffset="0" message="${escapeXML(label)}"/>`
          : '';
        const tag = power == null ? 'FreeRide' : 'SteadyState';
        return [
          `<${tag} Duration="${duration}"${power == null ? '' : ` Power="${power}"`}${cadence}>${annotation}</${tag}>`,
        ];
      });
  };
  const xml = steps(event.workout.steps);
  if (!xml.length) return unsupported();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<workout_file><author>OpenAthlete</author><name>${escapeXML(event.name)}</name><description>${escapeXML(event.description ?? '')}</description><sportType>bike</sportType><tags/><workout>${xml.join('')}</workout></workout_file>`;
}
