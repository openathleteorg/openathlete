import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { m } from '@/paraglide/messages';

import {
  RecordEffortDto,
  RecordExclusionDto,
  SPORT_TYPE,
} from '@openathlete/shared';

import {
  RECORD_METRICS,
  RecordMetric,
  formatRecordPosition,
  formatRecordValue,
  recordPosition,
} from './record-metrics';

const LATEST_SHOWN = 5;

interface LatestP {
  records: RecordEffortDto[];
  sport: SPORT_TYPE;
  year: number;
  dateFormat: Intl.DateTimeFormat;
  onSelect: (metric: RecordMetric, position: number) => void;
}

/** Records set this year, so that a new one does not go unnoticed. */
export function LatestRecordsCard({
  records,
  sport,
  year,
  dateFormat,
  onSelect,
}: LatestP) {
  return (
    <Card data-latest-records>
      <CardHeader>
        <CardTitle>{m.records_latest_title({ year })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {records.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {m.records_latest_empty()}
          </p>
        )}
        {records.slice(0, LATEST_SHOWN).map((record) => {
          const metric = RECORD_METRICS.find((x) => x.type === record.type);
          const position = recordPosition(record);
          if (!metric || position === null) return null;
          const { value, unit } = formatRecordValue(metric, record, sport);
          return (
            <button
              key={record.recordId}
              type="button"
              className="min-h-11 border-b py-2 text-left text-sm last:border-0 cursor-pointer group"
              onClick={() => onSelect(metric, position)}
            >
              <span className="font-medium group-hover:underline">
                {metric.title(sport)} {formatRecordPosition(metric, position)}
              </span>{' '}
              <span className="tabular-nums">{value}</span>{' '}
              <span className="text-xs text-muted-foreground tabular-nums">
                {unit}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {dateFormat.format(new Date(record.date))}
                {record.activityName && <> · {record.activityName}</>}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** What an exclusion covers, in words. */
function exclusionScope(
  exclusion: RecordExclusionDto,
  sport: SPORT_TYPE,
): string {
  const metric = RECORD_METRICS.find((x) => x.type === exclusion.type);
  if (!metric) return m.records_exclusion_activity();
  const position = exclusion.distance ?? exclusion.duration;
  return position === null
    ? metric.title(sport)
    : `${metric.title(sport)} ${formatRecordPosition(metric, position)}`;
}

interface ExclusionsP {
  exclusions: RecordExclusionDto[];
  sport: SPORT_TYPE;
  dateFormat: Intl.DateTimeFormat;
  onRestore: (exclusion: RecordExclusionDto) => void;
}

/** Everything set aside, to get it back at any time. */
export function RecordExclusionsCard({
  exclusions,
  sport,
  dateFormat,
  onRestore,
}: ExclusionsP) {
  return (
    <Card data-record-exclusions>
      <CardHeader>
        <CardTitle>{m.records_exclusions()}</CardTitle>
        {exclusions.length === 0 && (
          <CardDescription>{m.records_exclusions_empty()}</CardDescription>
        )}
      </CardHeader>
      {exclusions.length > 0 && (
        <CardContent className="flex flex-col">
          {exclusions.map((exclusion) => (
            <div
              key={exclusion.recordExclusionId}
              className="flex items-center justify-between gap-2 border-b py-2 last:border-0"
            >
              <span className="min-w-0 text-sm">
                <span className="block truncate font-medium">
                  {exclusion.activityName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {exclusionScope(exclusion, sport)} ·{' '}
                  {dateFormat.format(new Date(exclusion.date))}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(exclusion)}
              >
                {m.records_restore()}
              </Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
