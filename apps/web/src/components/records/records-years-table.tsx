import { Badge } from '@/components/ui/badge';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import {
  BestRecordDto,
  RECORD_TYPE,
  SPORT_TYPE,
  YearBestRecordDto,
} from '@openathlete/shared';

import { recordGap, recordKey } from './record-history';
import {
  RecordMetric,
  formatRecordPosition,
  formatRecordTime,
  formatRecordValue,
  recordPosition,
} from './record-metrics';

// Beyond this gap to the record, a year's cell keeps no tint
const HEAT_RANGE = 0.15;
const HEAT_STRONGEST = 28;

interface P {
  metric: RecordMetric;
  sport: SPORT_TYPE;
  records: BestRecordDto[];
  history: YearBestRecordDto[];
  years: number[];
  suspects: BestRecordDto[];
  dateFormat: Intl.DateTimeFormat;
  onSelect: (position: number) => void;
}

/** A row per distance or duration, its record then its best of each year. */
export function RecordsYearsTable({
  metric,
  sport,
  records,
  history,
  years,
  suspects,
  dateFormat,
  onSelect,
}: P) {
  const rows = records
    .filter((record) => metric.type === record.type)
    .sort((a, b) => (recordPosition(a) ?? 0) - (recordPosition(b) ?? 0));
  const flagged = new Set(suspects.map(recordKey));
  const best = new Map(
    history
      .filter((record) => record.type === metric.type)
      .map((record) => [`${recordPosition(record)}:${record.year}`, record]),
  );
  const yearValue = (record: BestRecordDto) =>
    metric.type === RECORD_TYPE.SPEED
      ? formatRecordTime(record)
      : metric.format(metric.plotted(record, sport), sport);
  const columns = {
    '--record-years': years.length,
  } as React.CSSProperties;

  return (
    <div className="overflow-x-auto" style={columns}>
      <div className="md:min-w-fit">
        <div className="hidden md:grid grid-cols-[5rem_minmax(13rem,1fr)_repeat(var(--record-years),5rem)] gap-x-2 px-4 py-2 border-y text-xs font-medium text-muted-foreground">
          <span>
            {metric.axis === 'distance' ? m.distance() : m.duration()}
          </span>
          <span>{m.records_record()}</span>
          {years.map((year) => (
            <span key={year} className="text-center">
              {year}
            </span>
          ))}
        </div>
        {rows.map((record) => {
          const position = recordPosition(record)!;
          const { value, unit } = formatRecordValue(metric, record, sport);
          return (
            <button
              key={position}
              type="button"
              data-record-row={formatRecordPosition(metric, position)}
              onClick={() => onSelect(position)}
              className="grid w-full grid-cols-2 md:grid-cols-[5rem_minmax(13rem,1fr)_repeat(var(--record-years),5rem)] items-center gap-x-2 gap-y-2 px-4 py-2 border-b last:border-0 text-left text-sm cursor-pointer hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span className="font-semibold whitespace-nowrap">
                {formatRecordPosition(metric, position)}
              </span>
              <span className="min-w-0 text-right md:text-left">
                <span className="font-semibold tabular-nums">{value}</span>{' '}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {unit}
                </span>
                {flagged.has(recordKey(record)) && (
                  <Badge variant="outline" className="ml-2">
                    {m.records_suspect_badge()}
                  </Badge>
                )}
                <span className="hidden md:block truncate text-xs text-muted-foreground">
                  {dateFormat.format(new Date(record.date))}
                  {record.activityName && <> · {record.activityName}</>}
                </span>
              </span>
              <span className="col-span-2 flex flex-wrap gap-1 md:contents">
                {years.map((year) => {
                  const season = best.get(`${position}:${year}`);
                  const isRecord = season?.recordId === record.recordId;
                  const heat = season
                    ? Math.max(
                        0,
                        HEAT_STRONGEST *
                          (1 - recordGap(season, record) / HEAT_RANGE),
                      )
                    : 0;
                  return (
                    <span
                      key={year}
                      data-record-year={year}
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--chart-1) ${heat.toFixed(0)}%, transparent)`,
                      }}
                      className={cn(
                        'flex min-h-11 md:min-h-9 min-w-13 flex-1 flex-col items-center justify-center rounded-md px-1 text-xs tabular-nums',
                        isRecord &&
                          'font-semibold ring-1 ring-inset ring-chart-1',
                        !season && 'text-muted-foreground',
                      )}
                    >
                      <span className="md:hidden text-[10px] font-normal text-muted-foreground">
                        {year}
                      </span>
                      {season ? yearValue(season) : '–'}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
