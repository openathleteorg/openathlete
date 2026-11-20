import { useFeature } from '@/hooks/use-feature';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Lock, Sparkles, X } from 'lucide-react';
import { ReactNode } from 'react';

import { Feature } from '@openathlete/shared';

import { Button } from '../ui/button';
import { SelectItem } from '../ui/select';
import { lockedOptionValue, useFeaturePaywall } from './feature-paywall';
import { FEATURE_TEXTS } from './feature-texts';
import { formatFeatureDay } from './format-feature-day';
import { useGateEvents, useGateViewed } from './gate-analytics';
import { useDismissed } from './use-dismissed';

/** "Supporter" with a small lock: calm, next to what it locks */
export function SupporterMark({ className }: { className?: string }) {
  return (
    <span
      data-supporter-lock
      className={cn(
        'inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <Lock aria-hidden className="size-3" />
      {m.feature_lock_label()}
    </span>
  );
}

/** "New · Supporters · for everyone on 20 Dec", at the entry of a feature */
export function EarlyAccessChip({
  feature,
  className,
}: {
  feature: Feature;
  className?: string;
}) {
  const { earlyAccess, hidden, availableToAllOn } = useFeature(feature);
  if (!earlyAccess || hidden || !availableToAllOn) return null;
  return (
    <span
      data-early-access={feature}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground',
        className,
      )}
    >
      <Sparkles aria-hidden className="size-3" />
      {m.feature_early_access_chip({
        date: formatFeatureDay(availableToAllOn),
      })}
    </span>
  );
}

interface PanelProps {
  feature: Feature;
  /** Where the lock is (PostHog) */
  place: string;
  /** A real figure computed for the user, shown above the text */
  preview?: ReactNode;
  /** A card the user may close, hidden for 30 days afterwards */
  dismissible?: boolean;
  /** Replaces the feature's sentence when the place says more */
  description?: string;
  /** A second button, such as going to the locked view */
  secondary?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * What a locked feature looks like: what it is, a thank-you rather than a
 * wall, and the paywall one click away.
 */
export function LockedPanel({
  feature,
  place,
  preview,
  dismissible,
  description,
  secondary,
  className,
}: PanelProps) {
  const paywall = useFeaturePaywall();
  const events = useGateEvents();
  const { dismissed, dismiss } = useDismissed(`${feature}.${place}`);
  const hiddenByUser = dismissible && dismissed;
  useGateViewed(feature, !hiddenByUser, place);
  if (hiddenByUser) return null;

  const texts = FEATURE_TEXTS[feature];
  return (
    <section
      data-locked-feature={feature}
      className={cn('relative space-y-3 rounded-xl bg-muted p-4', className)}
    >
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 size-11 text-muted-foreground md:size-8"
          aria-label={m.feature_gate_dismiss()}
          onClick={() => {
            events.dismissed(feature, place);
            dismiss();
          }}
        >
          <X />
        </Button>
      )}
      <SupporterMark />
      {preview}
      <div className="space-y-1 pr-8">
        <h3 className="text-sm font-medium text-pretty">{texts.title()}</h3>
        <p className="text-sm text-pretty text-muted-foreground">
          {description ?? texts.body()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-11 md:h-8"
          onClick={() => paywall.open(feature, place)}
        >
          {m.feature_gate_cta()}
        </Button>
        {secondary && (
          <Button
            size="sm"
            variant="outline"
            className="h-11 md:h-8"
            onClick={secondary.onClick}
          >
            {secondary.label}
          </Button>
        )}
      </div>
    </section>
  );
}

interface GateProps {
  feature: Feature;
  place: string;
  children: ReactNode;
  /** Shown instead of the default panel when the feature is locked */
  fallback?: ReactNode;
}

/** The feature when the user may use it, its teaser otherwise */
export function FeatureGate({ feature, place, children, fallback }: GateProps) {
  const { available, hidden } = useFeature(feature);
  if (available) return <>{children}</>;
  if (hidden) return null;
  return <>{fallback ?? <LockedPanel feature={feature} place={place} />}</>;
}

/**
 * An option of a Select, with the Supporter lock. Picking it opens the
 * paywall instead of changing the value: pass the Select's onValueChange
 * through useLockedSelect.
 */
export function LockedOption({
  feature,
  value,
  children,
}: {
  feature: Feature;
  value: string;
  children: ReactNode;
}) {
  return (
    <SelectItem value={lockedOptionValue(feature, value)}>
      <span className="flex w-full items-center justify-between gap-3">
        {children}
        <SupporterMark />
      </span>
    </SelectItem>
  );
}
