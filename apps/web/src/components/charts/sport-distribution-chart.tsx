import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';

import { SPORT_TYPE, StatisticsOverviewDto } from '@openathlete/shared';

import { SportIcon } from '../sport-icon/sport-icon';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

interface P {
  sports: StatisticsOverviewDto['sports'];
  keyToUse: keyof Omit<StatisticsOverviewDto['sports'][0], 'sport'>;
  formatter?: (value: number) => string;
  /** Sports in color order, so a sport keeps its color across charts */
  colorOrder?: SPORT_TYPE[];
}

const sliceColor = (colorRank: number, sizeRank: number) =>
  `var(--chart-${((colorRank >= 0 ? colorRank : sizeRank) % 7) + 1})`;

export function SportDistributionChart({
  sports,
  keyToUse,
  formatter,
  colorOrder,
}: P) {
  // Largest first, so the legend reads in the order of the slices
  const chartData = useMemo(() => {
    return [...sports]
      .filter((sport) => sport[keyToUse] > 0)
      .sort((a, b) => b[keyToUse] - a[keyToUse])
      .map((sport, i) => ({
        fill: sliceColor(colorOrder?.indexOf(sport.sport) ?? -1, i),
        value: sport[keyToUse],
        sport: sport.sport,
        name: sportTypeLabelMap[sport.sport],
      }));
  }, [sports, keyToUse, colorOrder]);

  const total = useMemo(
    () => sports.reduce((acc, v) => acc + v[keyToUse], 0),
    [sports, keyToUse],
  );

  if (chartData.length === 0) {
    return (
      <p className="px-6 pb-6 text-sm text-muted-foreground">
        {m.no_data_for_period()}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      <ChartContainer
        config={{
          sport: {
            label: m.sport(),
          },
        }}
        className="h-[220px] w-full"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, _, __, payload) => (
                  <div className="flex min-w-[130px] items-center text-xs text-muted-foreground gap-2">
                    <SportIcon
                      sport={
                        (payload as unknown as { sport: SPORT_TYPE }).sport
                      }
                    />
                    {name}
                    <div className="ml-auto flex items-baseline gap-0.5 font-medium tabular-nums text-foreground">
                      {Math.round((Number(value) / total) * 100)}
                      <span className="font-normal text-muted-foreground">
                        {m.percent_symbol()}
                      </span>
                    </div>
                    {formatter && <div>{formatter(Number(value))}</div>}
                  </div>
                )}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            isAnimationActive={false}
            strokeWidth={5}
          />
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-1.5 px-4 md:px-6 text-sm">
        {chartData.map((slice) => (
          <li
            key={slice.sport}
            className="flex items-center gap-2"
            data-sport-legend={slice.sport}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.fill }}
            />
            <SportIcon sport={slice.sport} />
            <span className="min-w-0 truncate">{slice.name}</span>
            <span className="ml-auto whitespace-nowrap tabular-nums">
              {formatter ? formatter(slice.value) : slice.value}
            </span>
            <span className="w-10 text-right text-muted-foreground tabular-nums">
              {Math.round((slice.value / total) * 100)}
              {m.percent_symbol()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
