import { useStatisticsTerrainQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';

import { SPORT_TYPE, StatisticsTerrainDto } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SkeletonChart } from '../ui/skeleton';
import { QuantileChart } from './quantile-chart';
import { QuickRead } from './quick-read';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

interface P {
  athleteId: number;
  period: Period | null;
  sport: SPORT_TYPE;
}

const MIN_SLOPES = 3;

const metresPerHour = (value: number) => `${Math.round(value)}`;
const percent = (value: number) => `${value}${m.percent_symbol()}`;

const points = (bins: StatisticsTerrainDto['bins']) =>
  bins.map(({ bin, ...quantiles }) => ({ x: bin, ...quantiles }));

function SlopeCard({
  title,
  bins,
  id,
  color,
}: {
  title: string;
  bins: StatisticsTerrainDto['bins'];
  id: string;
  color: string;
}) {
  return (
    <Card className="gap-0 py-0" data-terrain={id}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}{' '}
          <span className="font-normal text-muted-foreground">
            ({m.statistics_metres_per_hour()})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <QuantileChart
          points={points(bins)}
          label={title}
          formatX={percent}
          formatY={metresPerHour}
          color={color}
        />
      </CardContent>
    </Card>
  );
}

function Terrain({ data }: { data: StatisticsTerrainDto }) {
  const climb = data.bins.filter(({ bin }) => bin > 0);
  const descent = data.bins.filter(({ bin }) => bin < 0);
  // A single point is not a curve
  if (climb.length < MIN_SLOPES && descent.length < MIN_SLOPES) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {m.statistics_terrain_empty()}
        </CardContent>
      </Card>
    );
  }
  const total = (key: 'climbed' | 'descended') =>
    data.classes.reduce((sum, row) => sum + row[key], 0);
  const steepest = [...data.classes].sort((a, b) => b.climbed - a.climbed)[0];
  return (
    <div className="space-y-4">
      <QuickRead
        lines={[
          ...(steepest && steepest.climbed > 0
            ? [
                {
                  kind: 'observation' as const,
                  text: m.statistics_terrain_read_share({
                    share: Math.round(
                      (steepest.climbed / total('climbed')) * 100,
                    ),
                    from: steepest.from,
                    to: steepest.from + 5,
                  }),
                },
              ]
            : []),
          { kind: 'limit', text: m.statistics_terrain_read_limit() },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {climb.length >= MIN_SLOPES && (
          <SlopeCard
            id="climb"
            title={m.statistics_terrain_climb()}
            bins={climb}
            color="var(--chart-2)"
          />
        )}
        {descent.length >= MIN_SLOPES && (
          <SlopeCard
            id="descent"
            title={m.statistics_terrain_descent()}
            bins={descent}
            color="var(--chart-3)"
          />
        )}
      </div>
      <Card className="gap-0 py-0">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium">
            {m.statistics_terrain_classes()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-normal">
                  {m.statistics_terrain_slope()}
                </th>
                <th className="py-1 text-right font-normal">D+</th>
                <th className="py-1 text-right font-normal">D-</th>
              </tr>
            </thead>
            <tbody>
              {data.classes.map((row) => (
                <tr key={row.from} className="border-t">
                  <td className="py-1">
                    {row.from === 20
                      ? `20${m.percent_symbol()}+`
                      : `${row.from}-${row.from + 5}${m.percent_symbol()}`}
                  </td>
                  <td className="py-1 text-right">
                    {Math.round(row.climbed).toLocaleString()} {m.meters()}
                  </td>
                  <td className="py-1 text-right">
                    {Math.round(row.descended).toLocaleString()} {m.meters()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function TerrainSection({ athleteId, period, sport }: P) {
  return (
    <StatSection plain id="terrain" title={m.statistics_capacity_terrain()}>
      {(visible) => (
        <TerrainData
          athleteId={athleteId}
          period={period}
          sport={sport}
          visible={visible}
        />
      )}
    </StatSection>
  );
}

function TerrainData({
  athleteId,
  period,
  sport,
  visible,
}: P & { visible: boolean }) {
  const { data } = useStatisticsTerrainQuery(
    {
      athleteId,
      sport,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    visible && !!period,
  );
  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonChart className="h-[340px] rounded-xl" />
        <SkeletonChart className="h-[340px] rounded-xl" />
      </div>
    );
  }
  return <Terrain data={data} />;
}
