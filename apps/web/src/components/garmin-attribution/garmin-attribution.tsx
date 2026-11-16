import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { useHasGarminData } from './garmin-source';

// Plain text, small and quiet; see garmin-source.ts
type Kind = 'data' | 'insights';

const texts: Record<Kind, () => string> = {
  // Lists of Garmin activities or values (calendar, metrics)
  data: () => m.garmin_attribution_data(),
  // Figures computed from them: load, form, statistics, records, AI
  insights: () => m.garmin_attribution_insights(),
};

/** The attribution line, for views that already know Garmin data is shown */
export function GarminAttributionText({
  kind,
  className,
}: {
  kind: Kind;
  className?: string;
}) {
  return (
    <p
      data-garmin-attribution={kind}
      className={cn('text-[11px] leading-4 text-muted-foreground', className)}
    >
      {texts[kind]()}
    </p>
  );
}

/** The attribution line, shown only when the athlete has Garmin data */
export function GarminAttribution({
  athleteId,
  kind = 'insights',
  className,
}: {
  athleteId?: number | 'any';
  kind?: Kind;
  className?: string;
}) {
  const hasGarminData = useHasGarminData(athleteId);
  if (!hasGarminData) return null;
  return <GarminAttributionText kind={kind} className={className} />;
}
