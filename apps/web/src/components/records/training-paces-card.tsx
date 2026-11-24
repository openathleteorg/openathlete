import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';

import {
  BestRecordDto,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

import { formatRecordDistance } from './record-metrics';
import { bestVdotEffort, trainingPaces } from './vdot';

interface P {
  /** Most relevant first: the first one holding a usable effort is taken */
  recordSets: BestRecordDto[][];
}

/** Jack Daniels' training paces, from the athlete's best effort. */
export function TrainingPacesCard({ recordSets }: P) {
  const units = useUnits();
  const effort = recordSets.map(bestVdotEffort).find(Boolean);
  if (!effort) return null;

  const paceUnit = units.speedUnit('min/km');
  const paces = trainingPaces(effort.vdot);
  const format = (speed: number) => formatSpeed(speed, paceUnit);
  const rows = [
    {
      label: m.training_pace_easy(),
      pace: `${format(paces.easy.slowest)} – ${format(paces.easy.fastest)}`,
    },
    { label: m.training_pace_marathon(), pace: format(paces.marathon) },
    { label: m.training_pace_threshold(), pace: format(paces.threshold) },
    { label: m.training_pace_interval(), pace: format(paces.interval) },
    { label: m.training_pace_repetition(), pace: format(paces.repetition) },
  ];

  return (
    <Card data-training-paces>
      <CardHeader>
        <CardTitle>{m.training_paces_title()}</CardTitle>
        <CardDescription>
          {m.training_paces_source({
            vdot: effort.vdot.toFixed(1),
            distance: formatRecordDistance(effort.distance, units.unitSystem),
            time: formatDuration(effort.seconds),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(({ label, pace }) => (
              <tr key={label} className="border-b last:border-0">
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {label}
                </th>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">
                  {pace} {formatSpeedUnit(paceUnit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">
          {m.training_paces_help()}
        </p>
      </CardContent>
    </Card>
  );
}
