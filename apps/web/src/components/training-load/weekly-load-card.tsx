import { Card, CardContent } from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';

import { StatisticsLoadDto } from '@openathlete/shared';

export function WeeklyLoadCard({
  weeks,
}: {
  weeks: NonNullable<StatisticsLoadDto['weeklyLoad']>;
}) {
  const [latest] = weeks;
  if (!latest) return null;

  const locale = getLocale();
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });
  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const numberFormat = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });
  const maximum = Math.max(1, ...latest.days.map(({ load }) => load));

  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-4 p-4">
        <h3 className="text-sm font-medium">
          {m.statistics_weekly_load_title()}
        </h3>
        <figure className="space-y-2">
          <figcaption className="text-sm text-muted-foreground">
            {m.statistics_weekly_load_daily({
              date: dateFormat.format(new Date(latest.date)),
            })}
          </figcaption>
          <ul className="grid grid-cols-7 gap-1 text-center text-xs">
            {latest.days.map(({ date, load }) => (
              <li key={date} className="space-y-1">
                <div className="flex h-20 items-end justify-center" aria-hidden>
                  <div
                    className="w-3/4 max-w-10 rounded-t bg-[var(--chart-5)]"
                    style={{ height: `${(load / maximum) * 100}%` }}
                  />
                </div>
                <div className="text-muted-foreground">
                  {dayFormat.format(new Date(date))}
                </div>
                <div className="break-words tabular-nums">
                  {numberFormat.format(load)}
                </div>
              </li>
            ))}
          </ul>
        </figure>
        <p className="text-sm text-muted-foreground">
          {m.statistics_weekly_load_comparison()}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 pr-2 text-left font-medium">
                  {m.statistics_weekly_load_ending()}
                </th>
                <th scope="col" className="px-2 py-1 text-right font-medium">
                  {m.statistics_weekly_load_monotony()}
                </th>
                <th scope="col" className="py-1 pl-2 text-right font-medium">
                  {m.statistics_weekly_load_strain()}
                </th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.date} className="border-t">
                  <th scope="row" className="py-2 pr-2 text-left font-normal">
                    {dateFormat.format(new Date(week.date))}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {week.monotony !== undefined &&
                      numberFormat.format(week.monotony)}
                    {week.highMonotony && (
                      <div className="text-xs text-muted-foreground">
                        {m.statistics_weekly_load_high_monotony()}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums">
                    {week.strain !== undefined &&
                      numberFormat.format(week.strain)}
                    {week.highStrain && (
                      <div className="text-xs text-muted-foreground">
                        {m.statistics_weekly_load_high_strain()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
