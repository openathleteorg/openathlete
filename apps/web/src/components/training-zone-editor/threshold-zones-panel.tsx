import { useGetLatestMetricsQuery } from '@/api/metric';
import {
  useGetModeledMetricsQuery,
  useGetRunningEconomyQuery,
} from '@/api/record';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { cn } from '@/utils/shadcn';
import { Calculator } from 'lucide-react';
import { useState } from 'react';

import {
  METRIC_TYPE,
  TRAINING_ZONE_TYPE,
  powerToPace,
} from '@openathlete/shared';

import { thresholdZones } from './threshold-zones';
import { ZoneDraft, formatPace, parsePace } from './zone-profiles';

interface Source {
  id: string;
  label: string;
  /** Watts, bpm or minutes per km */
  value: number;
}

const round = (value: number) => Math.round(value);

/**
 * Five zones from a threshold the athlete picks: the modelled or the entered
 * FTP, a threshold heart rate, or a pace from a power threshold and the
 * athlete's own flat runs. Fills the editor; saving keeps them.
 */
export function ThresholdZonesPanel({
  athleteId,
  type,
  onApply,
}: {
  athleteId: number;
  type: TRAINING_ZONE_TYPE;
  onApply: (zones: Omit<ZoneDraft, 'key'>[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const isPace = type === TRAINING_ZONE_TYPE.PACE;
  const isPower = type === TRAINING_ZONE_TYPE.POWER;
  const usesPower = isPace || isPower;

  // Read only once the panel is open
  const { data: modeled } = useGetModeledMetricsQuery(athleteId, {
    enabled: open && usesPower,
  });
  const { data: metrics } = useGetLatestMetricsQuery(athleteId, {
    enabled: open && usesPower,
  });
  const { data: economy } = useGetRunningEconomyQuery(athleteId, {
    enabled: open && isPace,
  });

  const powers = [
    {
      type: METRIC_TYPE.FTP_RUNNING,
      modeled: modeled?.ftpRunning?.value,
      entered: metrics?.[METRIC_TYPE.FTP_RUNNING]?.value,
    },
    ...(isPower
      ? [
          {
            type: METRIC_TYPE.FTP_CYCLING,
            modeled: modeled?.ftpCycling?.value,
            entered: metrics?.[METRIC_TYPE.FTP_CYCLING]?.value,
          },
        ]
      : []),
  ];
  const sources: Source[] = powers.flatMap((power) =>
    (
      [
        ['modeled', power.modeled, m.zones_threshold_source_modeled],
        ['entered', power.entered, m.zones_threshold_source_entered],
      ] as const
    ).flatMap(([kind, watts, message]) => {
      if (!watts || !(watts > 0)) return [];
      const metric = metricTypeLabelMap[power.type];
      if (isPower) {
        return [
          {
            id: `${kind}-${power.type}`,
            label: message({ metric, value: `${round(watts)} W` }),
            value: round(watts),
          },
        ];
      }
      if (!economy) return [];
      const pace = powerToPace(watts, economy.value);
      return [
        {
          id: `${kind}-${power.type}`,
          label: message({
            metric,
            value: `${round(watts)} W → ${formatPace(pace)}/km`,
          }),
          value: pace,
        },
      ];
    }),
  );

  const threshold = isPace ? parsePace(input) : Number(input);
  const valid = threshold !== null && threshold > 0;

  const pick = (source: Source) => {
    setSourceId(source.id);
    setInput(isPace ? formatPace(source.value) : String(source.value));
  };

  const apply = () => {
    if (!valid) return;
    const zones = thresholdZones(type, threshold, {
      names: [m.zone_1(), m.zone_2(), m.zone_3(), m.zone_4(), m.zone_5()],
      descriptions: [
        m.ui_active_recovery(),
        m.endurance(),
        m.tempo(),
        m.threshold(),
        m.vo2_max(),
      ],
    });
    if (zones) {
      onApply(zones);
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="max-md:h-11"
        onClick={() => setOpen(true)}
      >
        <Calculator className="size-4" />
        {m.zones_threshold_open()}
      </Button>
    );
  }

  const label = isPace
    ? m.zones_threshold_pace_label()
    : isPower
      ? m.zones_threshold_power_label()
      : m.zones_threshold_hr_label();

  return (
    <div
      className="space-y-3 rounded-2xl border bg-card p-4"
      data-testid="threshold-zones"
    >
      <div>
        <p className="text-sm font-medium">{m.zones_threshold_title()}</p>
        <p className="text-xs text-muted-foreground">
          {m.zones_threshold_help()}
        </p>
      </div>
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              aria-pressed={sourceId === source.id}
              onClick={() => pick(source)}
              className={cn(
                'min-h-11 rounded-full border px-3 text-xs font-medium transition-colors md:min-h-8',
                sourceId === source.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {source.label}
            </button>
          ))}
        </div>
      )}
      {isPace && (
        <p className="text-xs text-muted-foreground">
          {economy
            ? m.zones_threshold_economy({
                value: economy.value,
                count: economy.activities,
                days: economy.days,
              })
            : m.zones_threshold_no_economy()}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="zones-threshold">{label}</Label>
        <Input
          id="zones-threshold"
          inputMode={isPace ? 'text' : 'numeric'}
          type={isPace ? 'text' : 'number'}
          placeholder={isPace ? '4:10' : undefined}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setSourceId(null);
          }}
        />
        {type === TRAINING_ZONE_TYPE.HEARTRATE && (
          <p className="text-xs text-muted-foreground">
            {m.zones_threshold_hr_help()}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {m.cancel()}
        </Button>
        <Button type="button" disabled={!valid} onClick={apply}>
          {m.zones_threshold_apply()}
        </Button>
      </div>
    </div>
  );
}
