import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMemo } from 'react';

import type { RacePlanVisualizationExport } from '@openathlete/shared';
import { formatDuration } from '@openathlete/shared';

type Props = {
  plan: RacePlanVisualizationExport;
};

export function LegsTable({ plan }: Props) {
  const startTime = useMemo(() => {
    const snap = plan.meta?.configSnapshot as any;
    const iso = (snap?.startTime || snap?.startDate) as string | undefined;
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [plan.meta]);

  const rows = useMemo(() => {
    let cumulativeSec = 0;
    return plan.legs
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((leg) => {
        const startSec =
          typeof leg.startTimeSec === 'number'
            ? leg.startTimeSec
            : cumulativeSec;
        const endSec =
          typeof leg.endTimeSec === 'number'
            ? leg.endTimeSec
            : (cumulativeSec = startSec + leg.totalTimeSec);
        return {
          index: leg.index,
          name: leg.name,
          km: leg.distanceM / 1000,
          gain: leg.elevationGainM,
          loss: leg.elevationLossM,
          durationSec: leg.totalTimeSec,
          movingSec: leg.movingTimeSec,
          stopSec: leg.stopTimeSec,
          departureDate: startTime
            ? new Date(startTime.getTime() + startSec * 1000)
            : null,
          arrivalDate: startTime
            ? new Date(startTime.getTime() + endSec * 1000)
            : null,
          temperatureC:
            typeof leg.averageTemperatureC === 'number'
              ? leg.averageTemperatureC
              : undefined,
        };
      });
  }, [plan.legs, startTime]);

  const fmtTemp = (t?: number) =>
    typeof t === 'number' ? `${t.toFixed(1)} °C` : '—';

  const fmtArrivee = (d: Date | null) =>
    d
      ? d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-medium">Sections (legs)</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead className="min-w-56">Nom</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Km</TableHead>
            <TableHead>D+ (m)</TableHead>
            <TableHead>D- (m)</TableHead>
            <TableHead>Départ</TableHead>
            <TableHead>Arrivée</TableHead>
            <TableHead>Temp Ø</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.index}>
              <TableCell>{r.index + 1}</TableCell>
              <TableCell className="truncate">{r.name}</TableCell>
              <TableCell>
                <div className="flex flex-col leading-tight">
                  <span className="font-medium">
                    {formatDuration(r.durationSec)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(r.movingSec)} + {formatDuration(r.stopSec)}
                  </span>
                </div>
              </TableCell>
              <TableCell>{r.km.toFixed(1)}</TableCell>
              <TableCell>{r.gain.toFixed(0)}</TableCell>
              <TableCell>{r.loss.toFixed(0)}</TableCell>
              <TableCell>{fmtArrivee(r.departureDate)}</TableCell>
              <TableCell>{fmtArrivee(r.arrivalDate)}</TableCell>
              <TableCell>{fmtTemp(r.temperatureC)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
