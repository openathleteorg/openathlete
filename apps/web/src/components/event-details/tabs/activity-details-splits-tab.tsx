import { m } from '@/paraglide/messages';

import { ActivityStream, formatDuration } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';

interface P {
  stream: ActivityStream | undefined;
}

export function ActivityDetailsSplitsTab({ stream }: P) {
  const splits = computeSplits(stream);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.splits()}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{m.kilometers()}</TableHead>
              <TableHead>{m.split()}</TableHead>
              <TableHead>
                {m.pace()} {m.per_km()}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {splits.map((s) => (
              <TableRow key={s.km}>
                <TableCell>{s.km}</TableCell>
                <TableCell>{formatSec(s.durationSec)}</TableCell>
                <TableCell>{formatDuration(s.paceSecPerKm)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function computeSplits(stream: ActivityStream | undefined) {
  const d = stream?.distance;
  const t = stream?.time;
  if (!d?.length || !t?.length)
    return [] as Array<{
      km: number;
      durationSec: number;
      paceSecPerKm: number;
    }>;

  const res: Array<{ km: number; durationSec: number; paceSecPerKm: number }> =
    [];
  const lastDistance = d[d.length - 1] ?? 0;
  const totalKm = Math.floor(lastDistance / 1000);
  if (totalKm <= 0) return res;

  const timeAtDistance = (targetM: number) => {
    let i = 0;
    while (i < d.length && d[i] < targetM) i++;
    if (i === 0) return t[0];
    if (i >= d.length) return t[t.length - 1];
    const d0 = d[i - 1];
    const d1 = d[i];
    const t0 = t[i - 1];
    const t1 = t[i];
    if (d1 === d0) return t1;
    const r = (targetM - d0) / (d1 - d0);
    return t0 + r * (t1 - t0);
  };

  let prevSplitTime = timeAtDistance(0);
  for (let km = 1; km <= totalKm; km++) {
    const distM = km * 1000;
    const currentTime = timeAtDistance(distM);
    const durationSec = currentTime - prevSplitTime;
    prevSplitTime = currentTime;
    const paceSecPerKm = durationSec;
    res.push({ km, durationSec, paceSecPerKm });
  }
  return res;
}

function formatSec(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}
