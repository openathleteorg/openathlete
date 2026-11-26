import { useGetEventNormalizationQuery } from '@/api/event';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';

import {
  ActivityEvent,
  NORMALIZATION_FACTOR,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const factorLabel = (factor: NORMALIZATION_FACTOR) => {
  if (factor === NORMALIZATION_FACTOR.SLOPE) return m.slope();
  if (factor === NORMALIZATION_FACTOR.RADIATION) return m.radiation();
  if (factor === NORMALIZATION_FACTOR.TEMPERATURE) return m.temperature();
  if (factor === NORMALIZATION_FACTOR.ALTITUDE) return m.altitude();
  if (factor === NORMALIZATION_FACTOR.WIND) return m.wind();
  if (factor === NORMALIZATION_FACTOR.HUMIDITY) return m.humidity();
  return factor;
};

/** The speed the conditions allowed, and the time each condition cost */
export function ActivityNormalizationCard({ event }: { event: ActivityEvent }) {
  const units = useUnits();
  const { data: normalization } = useGetEventNormalizationQuery(event.eventId);
  const config = getSportConfig(event.sport);
  const speedUnit = units.speedUnit(config.speedUnit);

  const costs = (normalization?.factors ?? [])
    .filter((factor) => (factor.timeSeconds ?? 0) > 0)
    .sort((a, b) => (b.timeSeconds ?? 0) - (a.timeSeconds ?? 0));
  if (!normalization || !normalization.factors.length) return null;

  return (
    <Card className="col-span-2" data-normalization>
      <CardHeader>
        <CardTitle>{m.normalized()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {typeof normalization.averageNormalizedSpeed === 'number' && (
          <div className="text-sm">
            <span className="font-medium">{m.normalized_speed()}:</span>{' '}
            {formatSpeed(normalization.averageNormalizedSpeed, speedUnit)}{' '}
            {formatSpeedUnit(speedUnit)}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.factor()}</TableHead>
                <TableHead className="text-right">{m.time_lost()}</TableHead>
                <TableHead className="text-right">{m.share()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((factor) => (
                <TableRow key={factor.factor}>
                  <TableCell>{factorLabel(factor.factor)}</TableCell>
                  <TableCell className="text-right">
                    {formatDuration(
                      Math.max(0, Math.round(factor.timeSeconds)),
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {Math.round(Math.max(0, factor.percent) * 100)}
                    {m.percent_symbol()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
