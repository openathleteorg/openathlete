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
  TRAINING_FOCUS_RATIOS,
  TrainingFocus,
  TrainingFocusDto,
  TrainingFocusValue,
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

const valueLabel: Record<TrainingFocusValue, () => string> = {
  AEROBIC_THRESHOLD: m.training_focus_value_aerobic,
  LACTATE_THRESHOLD: m.training_focus_value_threshold,
  VO2MAX: m.training_focus_value_vo2max,
};

function TrainingFocusTile({
  focus,
  missing,
  days,
}: {
  focus: TrainingFocusDto | null;
  missing: TrainingFocusValue[];
  days: number;
}) {
  const label = m.modeled_training_focus();
  if (!focus) {
    if (missing.length === 0) return <MetricTile label={label} value="–" />;
    return (
      <div
        title={m.modeled_training_focus_missing_title({
          values: missing.map((value) => valueLabel[value]()).join(', '),
          days,
        })}
      >
        <MetricTile
          label={label}
          value="–"
          caption={m.modeled_training_focus_missing()}
        />
      </div>
    );
  }
  const percent = new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: 1,
  });
  const share = (value: number) => percent.format(value * 100);
  const { ratios } = focus;
  const title = [
    m.modeled_training_focus_title({
      aerobic: focus.aerobicThreshold,
      threshold: focus.lactateThreshold,
      vo2max: focus.vo2max,
      days,
      r1: share(ratios.aerobicToVo2max),
      r2: share(ratios.aerobicToThreshold),
      r3: share(ratios.thresholdToVo2max),
      a1: share(TRAINING_FOCUS_RATIOS.aerobicToVo2max.average),
      a2: share(TRAINING_FOCUS_RATIOS.aerobicToThreshold.average),
      a3: share(TRAINING_FOCUS_RATIOS.thresholdToVo2max.average),
    }),
    focus.weaknesses.length > 0
      ? m.modeled_training_focus_weak({
          systems: focus.weaknesses.map((w) => weaknessLabel[w]()).join(', '),
        })
      : null,
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
        caption={
          focus.weaknesses.length > 0
            ? m.modeled_training_focus_caption_weak({
                systems: focus.weaknesses
                  .map((w) => weaknessLabel[w]())
                  .join(', '),
              })
            : m.modeled_training_focus_caption_none()
        }
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
              missing={data.trainingFocusRunningMissing}
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
