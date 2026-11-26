import { useGetLatestMetricsQuery } from '@/api/metric';
import {
  useGetModeledMetricsQuery,
  useGetRunningEconomyQuery,
} from '@/api/record';
import { GarminAttribution } from '@/components/garmin-attribution/garmin-attribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { cn } from '@/utils/shadcn';
import { Calculator } from 'lucide-react';
import { useState } from 'react';

import {
  METRIC_TYPE,
  TRAINING_ZONE_TYPE,
  formatSpeedUnit,
  powerToPace,
} from '@openathlete/shared';

import { thresholdZones } from './threshold-zones';
import {
  ZoneModelChoice,
  ZoneModelSport,
  ZoneRole,
  customTable,
  defaultCustomLimits,
  mergedTable,
  zoneModelChoices,
  zoneModelSport,
} from './zone-models';
import { ZoneDraft, formatPace, parsePace } from './zone-profiles';

interface Source {
  id: string;
  label: string;
  /** Watts, bpm or minutes per km */
  value: number;
}

const round = (value: number) => Math.round(value);

const ROLE_LABEL: Record<ZoneRole, () => string> = {
  recovery: m.ui_active_recovery,
  endurance: m.endurance,
  tempo: m.tempo,
  subThreshold: m.zones_role_sub_threshold,
  threshold: m.threshold,
  vo2max: m.vo2_max,
  anaerobic: m.zones_role_anaerobic,
  neuromuscular: m.zones_role_neuromuscular,
};

const CUSTOM = 'custom';

const choiceId = ({ model, table }: ZoneModelChoice) =>
  `${model.id}-${table.sport ?? 'all'}`;

const chip = (active: boolean) =>
  cn(
    'min-h-11 rounded-full border px-3 text-xs font-medium transition-colors md:min-h-8',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );

const sportLabel = (sport: ZoneModelSport) =>
  sport === 'run' ? m.zones_model_sport_run() : m.zones_model_sport_bike();

/**
 * Zones from a threshold the athlete picks (the modelled or the entered FTP
 * of the sport, a threshold heart rate, or a pace from a power threshold and
 * the athlete's own flat runs), by a published model or by five limits set
 * by hand. A model with sub-zones gives five zones, the count plans and
 * templates are built on, unless its own zones are asked for. Running and
 * cycling keep their own models and their own FTP. Fills the editor; saving
 * keeps them.
 */
export function ThresholdZonesPanel({
  athleteId,
  type,
  sports,
  currentCount,
  onApply,
}: {
  athleteId: number;
  type: TRAINING_ZONE_TYPE;
  /** The sports of the zone set: they choose the models and the FTP offered */
  sports: string[];
  /** Zones of the set now: a model with more or fewer changes them */
  currentCount: number;
  onApply: (zones: Omit<ZoneDraft, 'key'>[]) => void;
}) {
  const units = useUnits();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [original, setOriginal] = useState(false);
  const isPace = type === TRAINING_ZONE_TYPE.PACE;
  const isPower = type === TRAINING_ZONE_TYPE.POWER;
  const usesPower = isPace || isPower;

  const choices = zoneModelChoices(type, sports);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const custom = chosenId === CUSTOM || choices.length === 0;
  const choice = custom
    ? null
    : (choices.find((item) => choiceId(item) === chosenId) ?? choices[0]);
  const [limits, setLimits] = useState(() =>
    defaultCustomLimits(type, sports).map((share) =>
      String(Math.round(share * 100)),
    ),
  );
  const hasSubZones = !!choice && choice.table.zones.length !== 5;
  const table = custom
    ? customTable(
        type,
        limits.map((value) => Number(value.replace(',', '.')) / 100),
      )
    : choice && (original || !hasSubZones)
      ? choice.table
      : choice && mergedTable(choice.table);
  // Running and cycling apart: the sport of the model, else of the set
  const setSport = zoneModelSport(sports);
  const sport = choice?.table.sport ?? setSport;
  const mixed = new Set(choices.map((item) => item.table.sport)).size > 1;

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
    ...(sport !== 'bike'
      ? [
          {
            type: METRIC_TYPE.FTP_RUNNING,
            modeled: modeled?.ftpRunning?.value,
            entered: metrics?.[METRIC_TYPE.FTP_RUNNING]?.value,
          },
        ]
      : []),
    // Pace comes from running power only
    ...(isPower && sport !== 'run'
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
            value: `${round(watts)} W → ${formatPace(pace * units.paceFactor)}${units.unitSystem === 'IMPERIAL' ? '/mi' : '/km'}`,
          }),
          value: pace,
        },
      ];
    }),
  );

  const shownValue = (source: Source) =>
    isPace ? formatPace(source.value * units.paceFactor) : String(source.value);
  const picked = sources.find((source) => source.id === sourceId);
  const parsedThreshold = isPace ? parsePace(input) : Number(input);
  // A picked source untouched gives its own value, not the rounded one shown
  const threshold =
    picked && input === shownValue(picked)
      ? picked.value
      : parsedThreshold !== null && isPace
        ? parsedThreshold / units.paceFactor
        : parsedThreshold;
  const valid = threshold !== null && threshold > 0;

  const pick = (source: Source) => {
    setSourceId(source.id);
    setInput(shownValue(source));
  };

  const choose = (id: string) => {
    setChosenId(id);
    // A source of the other sport no longer fits
    setSourceId(null);
  };

  const apply = () => {
    if (!valid || !table) return;
    const zones = thresholdZones(type, threshold, table, (zone) => ({
      name: m.zones_model_zone_name({ id: zone.id }),
      description: ROLE_LABEL[zone.role](),
    }));
    if (zones) {
      onApply(zones);
      setOpen(false);
    }
  };
  const count = table?.zones.length ?? 0;

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
    ? m.zones_threshold_pace_label({
        unit: formatSpeedUnit(units.speedUnit('min/km')),
      })
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

      <div className="space-y-1.5">
        <p className="text-xs font-medium">{m.zones_model_label()}</p>
        <div className="flex flex-wrap gap-1.5" role="group">
          {choices.map((item) => {
            const id = choiceId(item);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={!custom && choice === item}
                onClick={() => choose(id)}
                className={chip(!custom && choice === item)}
              >
                {mixed && item.table.sport
                  ? m.zones_model_for_sport({
                      author: item.model.author,
                      sport: sportLabel(item.table.sport),
                    })
                  : item.model.author}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={custom}
            onClick={() => choose(CUSTOM)}
            className={chip(custom)}
          >
            {m.zones_model_custom()}
          </button>
        </div>

        {hasSubZones && (
          <div className="flex flex-wrap gap-1.5" role="group">
            {(
              [
                [false, m.zones_model_merged()],
                [
                  true,
                  m.zones_model_original({ count: choice.table.zones.length }),
                ],
              ] as const
            ).map(([value, text]) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={original === value}
                onClick={() => setOriginal(value)}
                className={chip(original === value)}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {custom ? (
          <div className="space-y-1.5" data-testid="custom-limits">
            <p className="text-xs text-muted-foreground">
              {isPace
                ? m.zones_model_custom_pace_help()
                : m.zones_model_custom_help()}
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {limits.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`zones-limit-${index}`} className="text-xs">
                    {isPace
                      ? m.zones_model_custom_pace_limit({
                          from: index + 1,
                          to: index + 2,
                        })
                      : m.zones_model_custom_limit({ zone: index + 2 })}
                  </Label>
                  <Input
                    id={`zones-limit-${index}`}
                    inputMode="decimal"
                    value={value}
                    onChange={(event) =>
                      setLimits((current) =>
                        current.map((item, at) =>
                          at === index ? event.target.value : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            {!table && (
              <p role="alert" className="text-xs text-destructive">
                {isPace
                  ? m.zones_model_custom_pace_invalid()
                  : m.zones_model_custom_invalid()}
              </p>
            )}
          </div>
        ) : (
          choice && (
            <p className="text-xs text-muted-foreground">
              {m.zones_model_source({ source: choice.model.source })}
            </p>
          )
        )}

        {count > 0 && count !== currentCount && (
          <p role="status" className="text-xs text-destructive">
            {m.zones_model_count_change({
              from: currentCount,
              to: count,
              kept: Math.min(currentCount, count),
            })}
          </p>
        )}
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              aria-pressed={sourceId === source.id}
              onClick={() => pick(source)}
              className={chip(sourceId === source.id)}
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
      {/* The modelled FTP and the economy come from the athlete's activities */}
      {(economy || (usesPower && modeled)) && (
        <GarminAttribution athleteId={athleteId} />
      )}
      <div className="space-y-1.5">
        <Label htmlFor="zones-threshold">{label}</Label>
        <Input
          id="zones-threshold"
          inputMode={isPace ? 'text' : 'numeric'}
          type={isPace ? 'text' : 'number'}
          placeholder={
            isPace
              ? units.unitSystem === 'IMPERIAL'
                ? '6:40'
                : '4:10'
              : undefined
          }
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
        <Button type="button" disabled={!valid || !table} onClick={apply}>
          {m.zones_threshold_apply()}
        </Button>
      </div>
    </div>
  );
}
