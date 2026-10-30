import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';

import { BestRecordDto, RECORD_TYPE, SPORT_TYPE } from '@openathlete/shared';

import {
  RecordMetric,
  formatRecordPosition,
  formatRecordTime,
  recordPosition,
} from './record-metrics';

export type RecordsColumn = {
  key: string;
  label: string;
  records: BestRecordDto[];
};

interface P {
  metric: RecordMetric;
  sport: SPORT_TYPE;
  columns: RecordsColumn[];
  onOpenActivity: (eventId: number) => void;
}

/** The records of one type, a row per distance or duration, a column per period. */
export function RecordsTable({ metric, sport, columns, onOpenActivity }: P) {
  const byColumn = columns.map(
    (column) =>
      new Map(
        column.records
          .filter((record) => record.type === metric.type)
          .map((record) => [recordPosition(record), record]),
      ),
  );
  const positions = [
    ...new Set(byColumn.flatMap((records) => [...records.keys()])),
  ]
    .filter((position): position is number => position !== null)
    .sort((a, b) => a - b);
  const dateFormat = new Intl.DateTimeFormat(getDateLocale(getLocale()), {
    dateStyle: 'medium',
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">
              {metric.axis === 'distance' ? m.distance() : m.duration()}
            </th>
            {columns.map((column) => (
              <th key={column.key} className="py-2 px-2 sm:px-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position} className="border-b last:border-0">
              <th
                scope="row"
                className="py-2 pr-3 text-left font-medium whitespace-nowrap"
              >
                {formatRecordPosition(metric, position)}
              </th>
              {byColumn.map((records, index) => {
                const record = records.get(position);
                return (
                  <td
                    key={columns[index].key}
                    className="py-2 px-2 sm:px-3 align-top whitespace-nowrap"
                  >
                    {record ? (
                      <div className="flex flex-col">
                        <span className="tabular-nums">
                          {metric.type === RECORD_TYPE.SPEED && (
                            <>{formatRecordTime(record)} · </>
                          )}
                          {metric.format(metric.plotted(record, sport), sport)}
                        </span>
                        {record.eventId ? (
                          <button
                            type="button"
                            className="text-left text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground cursor-pointer"
                            title={m.records_open_activity()}
                            onClick={() => onOpenActivity(record.eventId!)}
                          >
                            {dateFormat.format(new Date(record.date))}
                            {record.activityName && (
                              <> · {record.activityName}</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {dateFormat.format(new Date(record.date))}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
