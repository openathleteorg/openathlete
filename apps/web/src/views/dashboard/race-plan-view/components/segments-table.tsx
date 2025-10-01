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

export function SegmentsTable({ plan }: Props) {
  const startTime = useMemo(() => {
    const iso = plan.meta?.configSnapshot?.startTime as string | undefined;
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [plan.meta]);

  // Pre-compute a robust arrival time per segment end
  const rows = useMemo(() => {
    let cumulativeSec = 0;
    return plan.segments
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((s) => {
        const endSec =
          typeof s.endTimeSec === 'number'
            ? s.endTimeSec
            : (cumulativeSec += s.durationSec);
        return {
          index: s.index,
          km: s.lengthM / 1000,
          gain: s.elevationGainM,
          loss: s.elevationLossM,
          durationSec: s.durationSec,
          arrivalDate: startTime
            ? new Date(startTime.getTime() + endSec * 1000)
            : null,
          temperatureC:
            typeof s.temperatureC === 'number' ? s.temperatureC : undefined,
        };
      });
  }, [plan.segments, startTime]);

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
      <h3 className="font-medium">Segments</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Km</TableHead>
            <TableHead>D+ (m)</TableHead>
            <TableHead>D- (m)</TableHead>
            <TableHead>Arrivée</TableHead>
            <TableHead>Temp Ø</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.index}>
              <TableCell>{r.index + 1}</TableCell>
              <TableCell>{formatDuration(r.durationSec)}</TableCell>
              <TableCell>{r.km.toFixed(2)}</TableCell>
              <TableCell>{r.gain.toFixed(0)}</TableCell>
              <TableCell>{r.loss.toFixed(0)}</TableCell>
              <TableCell>{fmtArrivee(r.arrivalDate)}</TableCell>
              <TableCell>{fmtTemp(r.temperatureC)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
