import { StatisticsDurabilityDto } from '@openathlete/shared';

type Outing = StatisticsDurabilityDto['outings'][number];

/** Lower bounds of the classes of outings, in hours */
const CLASSES = [1, 1.5, 2, 3, 4];
const MIN_OUTINGS = 3;

function quantile(sorted: number[], share: number): number {
  const position = (sorted.length - 1) * share;
  const below = Math.floor(position);
  const above = Math.min(below + 1, sorted.length - 1);
  return sorted[below] + (sorted[above] - sorted[below]) * (position - below);
}

/**
 * Medians of the drift by length of outing. A class without enough outings is
 * left out rather than shown from a single long day.
 */
export function durabilityClasses(outings: Outing[]): StatisticsDurabilityDto {
  const kinds = [...new Set(outings.map(({ kind }) => kind))];
  return {
    outings,
    series: kinds.map((kind) => ({
      kind,
      classes: CLASSES.flatMap((fromHours, index) => {
        const to = CLASSES[index + 1] ?? Infinity;
        const percents = outings
          .filter(
            (outing) =>
              outing.kind === kind &&
              outing.hours >= fromHours &&
              outing.hours < to,
          )
          .map(({ percent }) => percent)
          .sort((a, b) => a - b);
        return percents.length < MIN_OUTINGS
          ? []
          : [
              {
                fromHours,
                low: quantile(percents, 0.25),
                median: quantile(percents, 0.5),
                high: quantile(percents, 0.75),
                count: percents.length,
              },
            ];
      }),
    })),
  };
}
