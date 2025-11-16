import { useTrainingZones } from '@/hooks/use-training-zones';
import { m } from '@/paraglide/messages';
import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';

import {
  ActivityStream,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  formatDuration,
} from '@openathlete/shared';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  heartrateStream: Exclude<ActivityStream['heartrate'], undefined>;
  duration?: number;
  sport?: SPORT_TYPE;
}

export function HeartrateDistributionChart({
  heartrateStream,
  sport,
  duration,
}: P) {
  const trainingZones = useTrainingZones(TRAINING_ZONE_TYPE.HEARTRATE, sport);

  const distribution = useMemo(() => {
    const distribution = new Array(trainingZones.length).fill(0);
    heartrateStream.forEach((heartrate) => {
      trainingZones.forEach((zone, i) => {
        if (heartrate >= zone.min && heartrate <= zone.max) {
          distribution[i]++;
        }
      });
    });
    return distribution;
  }, [heartrateStream, trainingZones]);

  const chartData = useMemo(() => {
    return trainingZones.map((zone, i) => ({
      zone: zone.name,
      distribution: distribution[i] / heartrateStream.length,
      fill: zone.color,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distribution, trainingZones]);

  return (
    <ChartContainer
      config={{
        heartrate: {
          label: m.heart_rate(),
        },
      }}
      className="h-[300px] w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex min-w-[130px] items-center text-xs text-muted-foreground gap-2">
                  {name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {Math.round(Number(value) * 100)}
                    <span className="font-normal text-muted-foreground">
                      {m.percent_symbol()}
                    </span>
                  </div>
                  {duration && (
                    <div className="">
                      {formatDuration(Number(value) * duration)}
                    </div>
                  )}
                </div>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="distribution"
          nameKey="zone"
          innerRadius={60}
          strokeWidth={5}
        />
      </PieChart>
    </ChartContainer>
  );
}
