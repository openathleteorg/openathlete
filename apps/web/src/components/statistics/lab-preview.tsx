import { useLabTeaserQuery } from '@/api/statistics';
import { useFeature } from '@/hooks/use-feature';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { Units } from '@/utils/units';

import {
  Feature,
  LabTeaserDto,
  SPORT_CONFIG,
  SPORT_TYPE,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

import { LockedPanel } from '../supporter-perks/locks';
import { MetricTile } from '../ui/metric-tile';

type Teaser = NonNullable<LabTeaserDto>;

const AXIS_LABELS: Record<Teaser['axis'], () => string> = {
  climb: m.statistics_profile_climb,
  descent: m.statistics_profile_descent,
  critical: m.statistics_profile_critical,
  cost: m.statistics_profile_cost,
};

/** The figure as the Lab's profile shows it */
function display(teaser: Teaser, sport: SPORT_TYPE, units: Units) {
  switch (teaser.axis) {
    case 'climb':
    case 'descent':
      return {
        value: `${units.elevation(teaser.value)}`,
        unit: units.verticalSpeedLabel,
      };
    case 'critical': {
      if (teaser.unit === 'power') {
        return { value: `${Math.round(teaser.value)}`, unit: 'W' };
      }
      const speedUnit = units.speedUnit(SPORT_CONFIG[sport].speedUnit);
      return {
        value: formatSpeed(teaser.value, speedUnit),
        unit: formatSpeedUnit(speedUnit),
      };
    }
    case 'cost':
      return { value: `${Math.round(teaser.value)}`, unit: m.bpm() };
  }
}

/** The capacity that progressed the most: a real figure of the athlete */
function TeaserTile({ teaser, sport }: { teaser: Teaser; sport: SPORT_TYPE }) {
  const units = useUnits();
  const change = new Intl.NumberFormat(getLocale(), {
    signDisplay: 'always',
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(teaser.change);
  return (
    <MetricTile
      className="max-w-xs bg-background"
      label={AXIS_LABELS[teaser.axis]()}
      caption={m.lab_teaser_progress({ change })}
      {...display(teaser, sport, units)}
    />
  );
}

/** The kind of chart the Lab draws, with made-up data, blurred: a glimpse */
function SampleChart({ variant }: { variant: 0 | 1 }) {
  const line =
    variant === 0
      ? 'M0,70 C40,66 70,52 110,46 S180,30 220,26 S280,18 320,14'
      : 'M0,24 C50,28 80,40 120,44 S190,58 230,60 S290,66 320,70';
  const band =
    variant === 0
      ? 'M0,82 C40,78 70,64 110,58 S180,42 220,38 S280,30 320,26 L320,4 C280,8 220,14 180,18 S110,34 70,40 S20,56 0,58 Z'
      : 'M0,12 C50,16 80,28 120,32 S190,46 230,48 S290,54 320,58 L320,82 C290,78 230,72 190,70 S120,56 80,52 S20,38 0,36 Z';
  return (
    <svg
      viewBox="0 0 320 90"
      preserveAspectRatio="none"
      className="h-36 w-full text-primary"
    >
      {[22, 45, 68].map((y) => (
        <line
          key={y}
          x1="0"
          x2="320"
          y1={y}
          y2={y}
          className="stroke-border"
          strokeWidth="1"
        />
      ))}
      <path d={band} className="fill-current opacity-15" />
      <path d={line} className="stroke-current" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

interface P {
  athleteId: number;
  sport: SPORT_TYPE | null;
}

/**
 * What a non-Supporter sees in the Lab: their capacity that progressed the
 * most, a blurred glimpse of the Lab's charts, and the thank-you
 */
export function LabPreview({ athleteId, sport }: P) {
  const { locked } = useFeature(Feature.LAB);
  const { data: teaser } = useLabTeaserQuery(athleteId, sport, locked);
  return (
    <div className="space-y-4" data-lab-preview>
      <LockedPanel
        feature={Feature.LAB}
        place="statistics_lab"
        preview={
          teaser && sport ? (
            <TeaserTile teaser={teaser} sport={sport} />
          ) : undefined
        }
      />
      <div
        aria-hidden
        className="pointer-events-none grid gap-4 select-none md:grid-cols-2"
      >
        {([0, 1] as const).map((variant) => (
          <div
            key={variant}
            className="space-y-3 rounded-xl border p-4 opacity-70 blur-[3px]"
          >
            <div className="h-3 w-1/3 rounded-full bg-muted-foreground/30" />
            <SampleChart variant={variant} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The one Lab card of the overview: a figure of the athlete, the way to the
 * Lab, closable for 30 days
 */
export function LabOverviewCard({
  athleteId,
  sport,
  onOpen,
}: P & { onOpen: () => void }) {
  const { locked } = useFeature(Feature.LAB);
  const { data: teaser } = useLabTeaserQuery(athleteId, sport, locked);
  if (!locked || !teaser || !sport) return null;
  return (
    <LockedPanel
      feature={Feature.LAB}
      place="statistics_overview"
      dismissible
      preview={<TeaserTile teaser={teaser} sport={sport} />}
      secondary={{ label: m.lab_overview_open(), onClick: onOpen }}
    />
  );
}
