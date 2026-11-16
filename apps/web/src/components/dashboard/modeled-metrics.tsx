import { useGetModeledMetricsQuery } from '@/api/record';
import { GarminAttribution } from '@/components/garmin-attribution/garmin-attribution';
import { MetricTile } from '@/components/ui/metric-tile';
import { SectionLabel } from '@/components/ui/section-label';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getDateLocale } from '@/utils/locales';

import {
  METRIC_TYPE,
  ModeledFtpDto,
  TrainingFocus,
  TrainingFocusDto,
  TrainingWeakness,
} from '@openathlete/shared';

const formatDay = (date: Date) =>
  date.toLocaleDateString(getDateLocale(getLocale()), {
    day: 'numeric',
    month: 'short',
  });

function ModeledFtpTile({
  type,
  ftp,
  days,
}: {
  type: METRIC_TYPE.FTP_RUNNING | METRIC_TYPE.FTP_CYCLING;
  ftp: ModeledFtpDto | null;
  days: number;
}) {
  const label = metricTypeLabelMap[type];
  if (!ftp) {
    return <MetricTile label={label} value="–" />;
  }
  const params = {
    percent: Math.round(ftp.factor * 100),
    minutes: ftp.duration / 60,
    date: formatDay(ftp.date),
  };
  return (
    // The tile is too small for where the value comes from
    <div
      title={m.modeled_ftp_title({
        ...params,
        power: ftp.power,
        activity: ftp.activityName ?? '',
        days,
      })}
    >
      <MetricTile
        label={label}
        value={ftp.value}
        unit="W"
        caption={m.modeled_ftp_caption(params)}
      />
    </div>
  );
}

const focusLabel: Record<TrainingFocus, () => string> = {
  AEROBIC_BASE: m.training_focus_aerobic_base,
  VO2MAX_THEN_THRESHOLD: m.training_focus_vo2max_then_threshold,
  VO2MAX: m.training_focus_vo2max,
  THRESHOLD: m.training_focus_threshold,
};

const weaknessLabel: Record<TrainingWeakness, () => string> = {
  AEROBIC: m.training_weakness_aerobic,
  THRESHOLD: m.training_weakness_threshold,
  VO2MAX: m.training_weakness_vo2max,
};

const percent = (share: number) => (share * 100).toFixed(1);

function TrainingFocusTile({
  focus,
  days,
}: {
  focus: TrainingFocusDto | null;
  days: number;
}) {
  const label = m.modeled_training_focus();
  if (!focus) return <MetricTile label={label} value="–" />;
  const { ratios } = focus;
  const title = [
    m.modeled_training_focus_title({
      aerobic: focus.aerobicThreshold,
      threshold: focus.lactateThreshold,
      vo2max: focus.vo2max,
      days,
      r1: percent(ratios.aerobicToVo2max),
      r2: percent(ratios.aerobicToThreshold),
      r3: percent(ratios.thresholdToVo2max),
    }),
    focus.weaknesses.length > 0
      ? m.modeled_training_focus_weak({
          systems: focus.weaknesses.map((w) => weaknessLabel[w]()).join(', '),
        })
      : null,
    focus.byRule ? null : m.modeled_training_focus_no_rule(),
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div title={title}>
      <MetricTile
        label={label}
        // Words, not a number: smaller to fit the tile
        value={focusLabel[focus.focus]()}
        valueClassName="text-sm leading-6"
        caption={[
          ratios.aerobicToVo2max,
          ratios.aerobicToThreshold,
          ratios.thresholdToVo2max,
        ]
          .map((share) => Math.round(share * 100))
          .join(' · ')
          .concat(' %')}
      />
    </div>
  );
}

/** FTP modelled from the best power of the last days, next to the load. */
export function ModeledMetrics({ athleteId }: { athleteId?: number }) {
  const { data, isLoading } = useGetModeledMetricsQuery(athleteId);

  return (
    <div className="space-y-1.5">
      <SectionLabel>{m.dashboard_header_modeled_metrics()}</SectionLabel>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : !data ||
        (!data.ftpRunning && !data.ftpCycling && !data.trainingFocusRunning) ? (
        <p className="text-xs text-muted-foreground">
          {m.dashboard_header_no_modeled_metrics({ days: data?.days ?? 90 })}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <ModeledFtpTile
              type={METRIC_TYPE.FTP_RUNNING}
              ftp={data.ftpRunning}
              days={data.days}
            />
            <ModeledFtpTile
              type={METRIC_TYPE.FTP_CYCLING}
              ftp={data.ftpCycling}
              days={data.days}
            />
            <TrainingFocusTile
              focus={data.trainingFocusRunning}
              days={data.days}
            />
          </div>
          {/* Derived from activity power, which Garmin devices may record */}
          <GarminAttribution athleteId={athleteId} />
        </>
      )}
    </div>
  );
}
