import { m } from '@/paraglide/messages';
import { Info } from 'lucide-react';

import { METRIC_REGISTRY, MetricKey } from '@openathlete/shared';

import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const COPY: Record<
  MetricKey,
  { name: () => string; what: () => string; limits: () => string }
> = {
  sessionRpe: {
    name: m.metric_srpe_name,
    what: m.metric_srpe_what,
    limits: m.metric_srpe_limits,
  },
  trimp: {
    name: m.metric_trimp_name,
    what: m.metric_trimp_what,
    limits: m.metric_trimp_limits,
  },
  ctl: {
    name: m.fitness_ctl,
    what: m.metric_ctl_what,
    limits: m.metric_ctl_limits,
  },
  atl: {
    name: m.fatigue_atl,
    what: m.metric_atl_what,
    limits: m.metric_atl_limits,
  },
  tsb: {
    name: m.tsb_balance,
    what: m.metric_tsb_what,
    limits: m.metric_tsb_limits,
  },
  intensityDistribution: {
    name: m.statistics_section_intensity,
    what: m.metric_intensity_what,
    limits: m.metric_intensity_limits,
  },
  efficiency: {
    name: m.statistics_efficiency,
    what: m.metric_efficiency_what,
    limits: m.metric_efficiency_limits,
  },
  decoupling: {
    name: m.statistics_decoupling,
    what: m.metric_decoupling_what,
    limits: m.metric_decoupling_limits,
  },
  longRun: {
    name: m.statistics_long_runs,
    what: m.metric_long_run_what,
    limits: m.metric_long_run_limits,
  },
  criticalSpeed: {
    name: m.statistics_critical_speed,
    what: m.metric_critical_speed_what,
    limits: m.metric_critical_speed_limits,
  },
  criticalSwimSpeed: {
    name: m.statistics_critical_swim,
    what: m.metric_critical_swim_what,
    limits: m.metric_critical_swim_limits,
  },
  criticalPower: {
    name: m.statistics_critical_power,
    what: m.metric_critical_power_what,
    limits: m.metric_critical_power_limits,
  },
  monotony: {
    name: m.statistics_monotony,
    what: m.metric_monotony_what,
    limits: m.metric_monotony_limits,
  },
  gap: { name: m.gap, what: m.metric_gap_what, limits: m.metric_gap_limits },
};

interface P {
  metric: MetricKey;
}

/** What a derived figure is, where it comes from and how far to trust it. */
export function MetricInfo({ metric }: P) {
  const { verdict, sources, formula } = METRIC_REGISTRY[metric];
  const copy = COPY[metric];
  const estimate = verdict === 'estimate';
  return (
    <span className="inline-flex items-center gap-1">
      {estimate && (
        <Badge
          variant="outline"
          className="px-1.5 py-0 text-[10px] font-normal"
        >
          {m.metric_estimate()}
        </Badge>
      )}
      <Popover>
        <PopoverTrigger
          aria-label={m.metric_info_label({ metric: copy.name() })}
          className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground md:size-6"
        >
          <Info className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2 text-sm">
          <p className="font-medium">{copy.name()}</p>
          <p>{copy.what()}</p>
          <p className="font-mono text-xs break-words text-muted-foreground">
            {formula}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">{m.metric_limits()}</span>{' '}
            {copy.limits()}
          </p>
          <p className="text-xs text-muted-foreground">
            {sources.map((source, index) => (
              <span key={source.url}>
                {index > 0 && ' · '}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {source.label}
                </a>
              </span>
            ))}
          </p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
