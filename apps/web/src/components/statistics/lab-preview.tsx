import { useLabTeaserQuery } from '@/api/statistics';
import { useFeature } from '@/hooks/use-feature';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';

import { Feature, LabTeaserDto, SPORT_TYPE } from '@openathlete/shared';

import { LockedPanel } from '../supporter-perks/locks';
import { MetricTile } from '../ui/metric-tile';
import { Skeleton } from '../ui/skeleton';

/** A change this small reads as stable rather than "0 %" */
const STABLE_BELOW = 0.005;

/** The teaser as a tile: one real figure of the athlete */
function TeaserTile({ teaser }: { teaser: NonNullable<LabTeaserDto> }) {
  const locale = getLocale();
  if (teaser.kind === 'efficiency') {
    return (
      <MetricTile
        className="max-w-xs bg-background"
        label={m.lab_teaser_efficiency_label()}
        value={
          Math.abs(teaser.value) < STABLE_BELOW
            ? m.lab_teaser_stable()
            : new Intl.NumberFormat(locale, {
                style: 'percent',
                signDisplay: 'exceptZero',
                maximumFractionDigits: 1,
              }).format(teaser.value)
        }
        caption={m.lab_teaser_weeks({ weeks: teaser.weeks })}
      />
    );
  }
  return (
    <MetricTile
      className="max-w-xs bg-background"
      label={m.lab_teaser_climb_label({ slope: teaser.slope ?? 0 })}
      value={new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(teaser.value)}
      unit="m/h"
      caption={m.lab_teaser_weeks({ weeks: teaser.weeks })}
    />
  );
}

interface P {
  athleteId: number;
  sport: SPORT_TYPE | null;
}

/**
 * What a non-Supporter sees in the Lab: one figure computed for them, the
 * cards they would get, blurred, and the thank-you
 */
export function LabPreview({ athleteId, sport }: P) {
  const { locked } = useFeature(Feature.LAB);
  const { data: teaser } = useLabTeaserQuery(athleteId, sport, locked);
  return (
    <div className="space-y-4" data-lab-preview>
      <LockedPanel
        feature={Feature.LAB}
        place="statistics_lab"
        preview={teaser ? <TeaserTile teaser={teaser} /> : undefined}
      />
      <div
        aria-hidden
        className="pointer-events-none grid gap-4 opacity-60 blur-[2px] select-none md:grid-cols-2"
      >
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-3 w-2/3" />
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
  if (!locked || !teaser) return null;
  return (
    <LockedPanel
      feature={Feature.LAB}
      place="statistics_overview"
      dismissible
      preview={<TeaserTile teaser={teaser} />}
      secondary={{ label: m.lab_overview_open(), onClick: onOpen }}
    />
  );
}
