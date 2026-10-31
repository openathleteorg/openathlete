import { MetricTile } from '@/components/ui/metric-tile';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';

import { BestRecordDto, SPORT_TYPE } from '@openathlete/shared';

import { recordGap } from './record-history';
import {
  RecordMetric,
  formatRecordPosition,
  formatRecordValue,
  recordPosition,
} from './record-metrics';

interface P {
  metric: RecordMetric;
  sport: SPORT_TYPE;
  positions: number[];
  records: BestRecordDto[];
  seasonRecords: BestRecordDto[];
  year: number;
  dateFormat: Intl.DateTimeFormat;
  onSelect: (position: number) => void;
}

/** The headline records, and how far this season stands from them. */
export function RecordsSummary({
  metric,
  sport,
  positions,
  records,
  seasonRecords,
  year,
  dateFormat,
  onSelect,
}: P) {
  const at = (list: BestRecordDto[], position: number) =>
    list.find(
      (record) =>
        record.type === metric.type && recordPosition(record) === position,
    );
  const percent = new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: 1,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {positions.map((position) => {
        const record = at(records, position);
        if (!record) return null;
        const season = at(seasonRecords, position);
        const { value, unit } = formatRecordValue(metric, record, sport);
        const caption = !season
          ? m.records_no_season({ year })
          : season.value === record.value
            ? m.records_season_record({ year })
            : m.records_season_gap({
                year,
                value: formatRecordValue(metric, season, sport).value,
                gap: percent.format(recordGap(season, record) * 100),
              });
        return (
          <button
            key={position}
            type="button"
            className="min-w-0 text-left cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => onSelect(position)}
          >
            <MetricTile
              className="hover:bg-accent h-full"
              label={`${formatRecordPosition(metric, position)} · ${dateFormat.format(new Date(record.date))}`}
              value={<span className="tabular-nums">{value}</span>}
              unit={unit}
              caption={caption}
            />
          </button>
        );
      })}
    </div>
  );
}
