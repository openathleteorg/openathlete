import { m } from '@/paraglide/messages';

import {
  ActivityStream,
  SPORT_TYPE,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

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
  sport: SPORT_TYPE;
}

export function ActivityDetailsSplitsTab({ stream, sport }: P) {
  const config = getSportConfig(sport);
  const splits = computeSplits(stream);

  const speedLabel = config.speedLabel === 'pace' ? m.pace() : m.speed();
  const speedUnitLabel = formatSpeedUnit(config.speedUnit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.splits()}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.kilometers()}</TableHead>
                <TableHead>{m.split()}</TableHead>
                <TableHead>
                  {speedLabel} ({speedUnitLabel})
                </TableHead>
                {config.showElevation && (
                  <>
                    <TableHead>
                      {m.elevation_gain()} ({m.meters()})
                    </TableHead>
                    <TableHead>
                      {m.elevation_loss()} ({m.meters()})
                    </TableHead>
                  </>
                )}
                {config.showGap && (
                  <TableHead>
                    {m.gap()} ({speedUnitLabel})
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((s) => (
                <TableRow key={s.km}>
                  <TableCell>{s.km}</TableCell>
                  <TableCell>{formatSec(s.durationSec)}</TableCell>
                  <TableCell>
                    {formatSpeed(
                      s.paceSecPerKm > 0 ? 1000 / s.paceSecPerKm : 0,
                      config.speedUnit,
                    )}
                  </TableCell>
                  {config.showElevation && (
                    <>
                      <TableCell>
                        {s.ascentM !== undefined ? Math.round(s.ascentM) : '-'}
                      </TableCell>
                      <TableCell>
                        {s.descentM !== undefined
                          ? Math.round(s.descentM)
                          : '-'}
                      </TableCell>
                    </>
                  )}
                  {config.showGap && (
                    <TableCell>
                      {s.gapMps !== undefined
                        ? formatSpeed(s.gapMps, config.speedUnit)
                        : '-'}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function computeSplits(stream: ActivityStream | undefined) {
  const d = stream?.distance;
  const t = stream?.time;
  const alt = stream?.altitude;
  const gap = (stream as unknown as { gap: number[] })?.gap as
    | number[]
    | undefined;
  if (!d?.length || !t?.length)
    return [] as Array<{
      km: number;
      durationSec: number;
      paceSecPerKm: number;
      ascentM?: number;
      descentM?: number;
      gapMps?: number;
    }>;

  const res: Array<{
    km: number;
    durationSec: number;
    paceSecPerKm: number;
    ascentM?: number;
    descentM?: number;
    gapMps?: number;
  }> = [];
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

  const elevationAtDistance = (targetM: number) => {
    if (!alt?.length) return undefined as number | undefined;
    let i = 0;
    while (i < d.length && d[i] < targetM) i++;
    if (i === 0) return alt[0];
    if (i >= d.length) return alt[alt.length - 1];
    const d0 = d[i - 1];
    const d1 = d[i];
    const a0 = alt[i - 1];
    const a1 = alt[i];
    if (d1 === d0) return a1;
    const r = (targetM - d0) / (d1 - d0);
    return a0 + r * (a1 - a0);
  };

  for (let km = 1; km <= totalKm; km++) {
    const startDist = (km - 1) * 1000;
    const endDist = km * 1000;
    const Ts = timeAtDistance(startDist);
    const Te = timeAtDistance(endDist);
    const durationSec = Te - Ts;
    const paceSecPerKm = durationSec;

    // Cumulative D+ / D- within the split
    let ascentM: number | undefined = undefined;
    let descentM: number | undefined = undefined;
    if (alt?.length) {
      const alts: number[] = [];
      const aStart = elevationAtDistance(startDist);
      const aEnd = elevationAtDistance(endDist);
      if (aStart !== undefined) alts.push(aStart);
      for (let i = 0; i < d.length; i++) {
        if (d[i] > startDist && d[i] < endDist) alts.push(alt[i]!);
      }
      if (aEnd !== undefined) alts.push(aEnd);
      let up = 0;
      let down = 0;
      for (let i = 1; i < alts.length; i++) {
        const delta = alts[i] - alts[i - 1];
        if (delta > 0) up += delta;
        else if (delta < 0) down += -delta;
      }
      ascentM = up;
      descentM = down;
    }

    // Time-weighted average GAP (m/s) over [Ts, Te]
    let gapMps: number | undefined = undefined;
    if (gap?.length === t.length) {
      const total = Te - Ts;
      if (total > 0) {
        let weighted = 0;
        // find first index where t[i] > Ts
        let i = 0;
        while (i < t.length && t[i] <= Ts) i++;
        let prevIndex = Math.max(0, i - 1);
        let currentTime = Ts;
        while (currentTime < Te) {
          const nextTime = i < t.length ? Math.min(Te, t[i]) : Te;
          const dt = nextTime - currentTime;
          if (dt > 0) weighted += (gap[prevIndex] ?? 0) * dt;
          currentTime = nextTime;
          if (i < t.length && t[i] <= Te) {
            prevIndex = i;
            i++;
          } else {
            break;
          }
        }
        gapMps = weighted / total;
      }
    }

    res.push({ km, durationSec, paceSecPerKm, ascentM, descentM, gapMps });
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
