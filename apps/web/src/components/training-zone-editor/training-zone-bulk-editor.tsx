import { useGetLatestMetricsQuery } from '@/api/metric';
import {
  useCreateTrainingZone,
  useDeleteTrainingZone,
  useUpdateTrainingZone,
} from '@/api/training-zone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  METRIC_TYPE,
  TRAINING_ZONE_TYPE,
  TrainingZone,
  TrainingZoneValue,
} from '@openathlete/shared';

import {
  DEFAULT_HEART_RATE_PERCENTAGES,
  heartRateToPercentage,
  isValidMaxHeartRate,
  isValidRestingHeartRate,
  percentageToHeartRate,
} from './heart-rate-percentages';
import { MultiSportSelector } from './multi-sport-selector';
import { ALL_SPORTS, describeSports } from './sport-summary';
import {
  ZoneDraft,
  ZoneMode,
  ZoneProfile,
  assignSports,
  coversRemainingSports,
  dropProfile,
  groupZoneProfiles,
  isDescending,
  moveLimit,
  nextZoneName,
  paceStep,
  removeZone,
  splitLastZone,
} from './zone-profiles';
import { ZoneRow } from './zone-row';

type DefaultZone = Omit<ZoneDraft, 'key' | 'id'>;

interface TrainingZoneBulkEditorProps {
  athleteId: number;
  type: TRAINING_ZONE_TYPE;
  zones: (TrainingZone & { values: TrainingZoneValue[] })[];
  onComplete: () => void;
}

const DEFAULT_COLORS = [
  '#9CA3AF', // gray-400
  '#22C55E', // green-500
  '#EAB308', // yellow-500
  '#F97316', // orange-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
];

function getUnitLabel(type: TRAINING_ZONE_TYPE): string {
  switch (type) {
    case TRAINING_ZONE_TYPE.HEARTRATE:
      return m.bpm();
    case TRAINING_ZONE_TYPE.POWER:
      return m.watts();
    case TRAINING_ZONE_TYPE.PACE:
      return m.per_km();
    default:
      return '';
  }
}

/** Proportions of the zones, to see what the numbers mean. */
function ZonesBar({ zones }: { zones: ZoneDraft[] }) {
  const widths = zones.map((zone) => Math.max(zone.max - zone.min, 0));
  if (!widths.some(Boolean) || widths.some(Number.isNaN)) return null;
  return (
    <div aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-full">
      {zones.map((zone, index) => (
        <div
          key={zone.key}
          style={{ backgroundColor: zone.color, flexGrow: widths[index] || 1 }}
        />
      ))}
    </div>
  );
}

export function TrainingZoneBulkEditor({
  athleteId,
  type,
  zones: existingZones,
  onComplete,
}: TrainingZoneBulkEditorProps) {
  const isHeartRate = type === TRAINING_ZONE_TYPE.HEARTRATE;
  const isPace = type === TRAINING_ZONE_TYPE.PACE;
  const lastKey = useRef(0);
  const nextKey = () => ++lastKey.current;
  // Initialize once: mutation invalidations must not overwrite unsaved edits.
  const [profiles, setProfiles] = useState<ZoneProfile[]>(() =>
    existingZones.length
      ? groupZoneProfiles(existingZones, nextKey)
      : [
          {
            key: nextKey(),
            sports: ALL_SPORTS,
            mode: isHeartRate ? 'max' : 'absolute',
            zones: getDefaultZones(type).map((zone) => ({
              ...zone,
              key: nextKey(),
            })),
          },
        ],
  );
  const [coversRest] = useState(() => coversRemainingSports(profiles));
  const [activeKey, setActiveKey] = useState(profiles[0].key);
  const active =
    profiles.find((profile) => profile.key === activeKey) ?? profiles[0];
  const { zones, mode } = active;
  const percentageMode = mode !== 'absolute';
  const reserveMode = mode === 'reserve';
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hrMaxInput, setHrMaxInput] = useState<string>();
  const [hrRestInput, setHrRestInput] = useState<string>();
  const [pendingMode, setPendingMode] = useState<'max' | 'reserve' | null>(
    null,
  );
  const { data: metrics } = useGetLatestMetricsQuery(athleteId, {
    enabled: isHeartRate,
  });
  const hrMaxValue =
    hrMaxInput ?? String(metrics?.[METRIC_TYPE.HR_MAX]?.value ?? '');
  const hrMax = Number(hrMaxValue);
  const hrRestValue =
    hrRestInput ?? String(metrics?.[METRIC_TYPE.HR_REST]?.value ?? '');
  const hrRest = Number(hrRestValue);
  const deletedIds = useRef(new Set<number>());

  const createZone = useCreateTrainingZone();
  const updateZone = useUpdateTrainingZone();
  const deleteZone = useDeleteTrainingZone();

  const updateActive = (change: Partial<ZoneProfile>) =>
    setProfiles((current) =>
      current.map((profile) =>
        profile.key === active.key ? { ...profile, ...change } : profile,
      ),
    );

  /** What a set saves as, or null while it cannot be saved */
  const resolveZones = (profile: ZoneProfile): ZoneDraft[] | null => {
    const incomplete =
      !profile.sports.length ||
      profile.zones.some(
        (zone) =>
          !zone.name.trim() ||
          !Number.isFinite(zone.min) ||
          !Number.isFinite(zone.max) ||
          zone.min < 0 ||
          zone.min > zone.max,
      );
    if (incomplete) return null;
    if (profile.mode === 'absolute') return profile.zones;
    // Never treat a missing resting HR as zero when reserve mode is selected.
    if (profile.mode === 'reserve' && !isValidRestingHeartRate(hrRest, hrMax)) {
      return null;
    }
    try {
      return profile.zones.map((zone) => ({
        ...zone,
        ...percentageToHeartRate(
          zone,
          hrMax,
          profile.mode === 'reserve' ? hrRest : 0,
        ),
      }));
    } catch {
      return null;
    }
  };
  const resolved = new Map(
    profiles.map((profile) => [profile.key, resolveZones(profile)]),
  );
  const invalid = [...resolved.values()].some((value) => value === null);
  const activeResolved = resolved.get(active.key);
  const step = percentageMode ? 0 : isPace ? paceStep : 1;
  const descending = isDescending(zones);
  const unit = percentageMode ? '%' : getUnitLabel(type);

  const changeMode = (nextMode: ZoneMode) => {
    const nextPercentageMode = nextMode !== 'absolute';
    const nextReserveMode = nextMode === 'reserve';
    if (mode === nextMode) return;
    try {
      // Changing the percentage basis keeps the percentages and recalculates
      // their bpm preview. Switching units preserves the absolute bpm ranges.
      if (percentageMode !== nextPercentageMode) {
        if (
          (nextReserveMode || (percentageMode && reserveMode)) &&
          !isValidRestingHeartRate(hrRest, hrMax)
        ) {
          throw new Error('Resting heart rate is required');
        }
        updateActive({
          mode: nextMode,
          zones: zones.map((zone) => ({
            ...zone,
            ...(nextPercentageMode
              ? heartRateToPercentage(zone, hrMax, nextReserveMode ? hrRest : 0)
              : percentageToHeartRate(zone, hrMax, reserveMode ? hrRest : 0)),
          })),
        });
      } else {
        updateActive({ mode: nextMode });
      }
      setPendingMode(null);
      setError('');
    } catch {
      if (!percentageMode && nextMode !== 'absolute') setPendingMode(nextMode);
      setError(m.hr_zones_conversion_error());
    }
  };

  const handleAddZone = () => {
    const added = splitLastZone(zones, step, {
      key: nextKey(),
      name: nextZoneName(zones, m.zone()),
      color: DEFAULT_COLORS[zones.length % DEFAULT_COLORS.length],
    });
    if (added) updateActive({ zones: added });
  };

  const handleAddSport = () => {
    const key = nextKey();
    // A copy of what is on screen: most sports differ by a few limits only
    const copy = zones.map((zone) => ({
      ...zone,
      id: undefined,
      key: nextKey(),
    }));
    setProfiles([...profiles, { ...active, key, sports: [], zones: copy }]);
    setActiveKey(key);
    setPendingMode(null);
  };

  const handleRemoveSport = () => {
    const rest = dropProfile(profiles, active.key, coversRest);
    setProfiles(rest);
    setActiveKey(rest[0].key);
  };

  const handleSave = async () => {
    if (invalid || isSaving) return;
    setError('');
    setIsSaving(true);
    try {
      // Identify zones to delete (existing zones not in current list)
      const currentIds = profiles.flatMap((profile) =>
        profile.zones.map((zone) => zone.id).filter(Boolean),
      );
      const zonesToDelete = existingZones.filter(
        (ez) =>
          !currentIds.includes(ez.trainingZoneId) &&
          !deletedIds.current.has(ez.trainingZoneId),
      );

      // Delete removed zones
      for (const zone of zonesToDelete) {
        await deleteZone.mutateAsync(zone.trainingZoneId);
        deletedIds.current.add(zone.trainingZoneId);
      }

      // Create or update zones
      for (const profile of profiles) {
        for (const zone of resolved.get(profile.key) ?? []) {
          const body = {
            name: zone.name,
            description: zone.description,
            min: zone.min,
            max: zone.max,
            color: zone.color,
            sports: profile.sports,
          };
          if (zone.id) {
            await updateZone.mutateAsync({ trainingZoneId: zone.id, body });
          } else {
            const created = await createZone.mutateAsync({
              ...body,
              athleteId,
              type,
            });
            // A retry after a failure must not create this zone again
            setProfiles((current) =>
              current.map((item) => ({
                ...item,
                zones: item.zones.map((draft) =>
                  draft.key === zone.key
                    ? { ...draft, id: created.trainingZoneId }
                    : draft,
                ),
              })),
            );
          }
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error saving zones:', error);
      toast.error(m.hr_zones_save_error());
    } finally {
      setIsSaving(false);
    }
  };

  const referenceFields = (includeRest: boolean) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="zones-hr-max">
          {m.max_heart_rate()} ({m.bpm()})
        </Label>
        <Input
          id="zones-hr-max"
          type="number"
          min={1}
          max={300}
          step={1}
          value={hrMaxValue}
          onChange={(event) => {
            setHrMaxInput(event.target.value);
            setError('');
          }}
        />
      </div>
      {includeRest && (
        <div className="space-y-1.5">
          <Label htmlFor="zones-hr-rest">
            {m.hr_zones_resting_hr()} ({m.bpm()})
          </Label>
          <Input
            id="zones-hr-rest"
            type="number"
            min={1}
            max={hrMax > 1 ? hrMax - 1 : undefined}
            step={1}
            value={hrRestValue}
            onChange={(event) => {
              setHrRestInput(event.target.value);
              setError('');
            }}
          />
          <p className="text-xs text-muted-foreground">
            {m.hr_zones_resting_help()}
          </p>
        </div>
      )}
    </div>
  );

  const profileLabel = (profile: ZoneProfile, index: number) => {
    if (!profile.sports.length) return m.select_sports();
    if (index === 0 && profiles.length > 1 && coversRest) {
      return m.zones_other_sports();
    }
    return describeSports(profile.sports);
  };

  const modeButton = (value: ZoneMode, label: string) => {
    const pressed = (pendingMode ?? mode) === value;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={() => changeMode(value)}
        className={cn(
          'min-h-11 rounded-md px-3 text-sm font-medium transition-colors md:min-h-8',
          pressed
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <fieldset disabled={isSaving} className="min-w-0 space-y-5">
      <div
        aria-label={m.sports()}
        className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1"
      >
        {profiles.map((profile, index) => (
          <button
            key={profile.key}
            type="button"
            aria-pressed={profile.key === active.key}
            data-zone-profile
            onClick={() => {
              setActiveKey(profile.key);
              setPendingMode(null);
            }}
            className={cn(
              'flex h-9 max-w-56 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors max-md:h-11',
              profile.key === active.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground',
              resolved.get(profile.key) === null &&
                profile.key !== active.key &&
                'ring-2 ring-destructive',
            )}
          >
            <span className="truncate">{profileLabel(profile, index)}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={handleAddSport}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-dashed px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground max-md:h-11"
        >
          <Plus className="size-4" />
          {m.zones_add_sport()}
        </button>
      </div>

      {active.key !== profiles[0].key && (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <MultiSportSelector
              value={active.sports}
              onChange={(sports) =>
                setProfiles(
                  assignSports(profiles, active.key, sports, coversRest),
                )
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 max-md:size-11"
            aria-label={m.zones_remove_sport()}
            onClick={handleRemoveSport}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      {isHeartRate && (
        <div className="space-y-3">
          <div
            className="grid gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3"
            role="group"
            aria-label={m.hr_zones_input_mode()}
          >
            {modeButton('absolute', m.hr_zones_manual())}
            {modeButton('reserve', m.hr_zones_reserve_percent())}
            {modeButton('max', m.percent_of_max_heart_rate())}
          </div>
          {(percentageMode || pendingMode) &&
            referenceFields(
              pendingMode ? pendingMode === 'reserve' : reserveMode,
            )}
          {pendingMode && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingMode(null);
                  setError('');
                }}
              >
                {m.cancel()}
              </Button>
              <Button type="button" onClick={() => changeMode(pendingMode)}>
                {m.hr_zones_convert_limits()}
              </Button>
            </div>
          )}
          {reserveMode && !pendingMode && (
            <p className="text-xs text-muted-foreground">
              {m.hr_zones_reserve_formula()}
            </p>
          )}
          {percentageMode &&
            reserveMode &&
            !isValidRestingHeartRate(hrRest, hrMax) && (
              <p role="alert" className="text-sm text-destructive">
                {m.hr_zones_rest_required()}
              </p>
            )}
          {percentageMode && !isValidMaxHeartRate(hrMax) && (
            <p role="alert" className="text-sm text-destructive">
              {m.hr_zones_max_required()}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <ZonesBar zones={activeResolved ?? zones} />
        <div className="divide-y overflow-hidden rounded-2xl border bg-card">
          {zones.map((zone, index) => {
            const saved = activeResolved?.[index];
            return (
              <ZoneRow
                key={zone.key}
                zone={zone}
                index={index}
                startField={descending ? 'max' : 'min'}
                isPace={isPace}
                isPercentage={percentageMode}
                unit={unit}
                invalid={
                  zone.min > zone.max ||
                  Number.isNaN(zone.min) ||
                  Number.isNaN(zone.max)
                }
                openEnded={!isHeartRate && index === zones.length - 1}
                preview={
                  percentageMode && saved ? (
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid="hr-zone-preview"
                    >
                      {saved.min}–{saved.max} {m.bpm()}
                    </p>
                  ) : undefined
                }
                canRemove={zones.length > 1}
                onLimit={(field, value) => {
                  setError('');
                  updateActive({
                    zones: moveLimit(zones, index, field, value, step),
                  });
                }}
                onChange={(change) =>
                  updateActive({
                    zones: zones.map((item) =>
                      item.key === zone.key ? { ...item, ...change } : item,
                    ),
                  })
                }
                onRemove={() =>
                  updateActive({ zones: removeZone(zones, index) })
                }
              />
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="max-md:h-11"
            onClick={handleAddZone}
          >
            <Plus className="size-4" />
            {m.add_zone()}
          </Button>
          {percentageMode && (zones.length === 5 || zones.length === 6) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="max-md:h-11"
              onClick={() => {
                const defaults = DEFAULT_HEART_RATE_PERCENTAGES.slice(
                  zones.length === 5 ? 1 : 0,
                );
                updateActive({
                  zones: zones.map((zone, index) => ({
                    ...zone,
                    ...defaults[index],
                  })),
                });
                setError('');
              }}
            >
              {m.hr_zones_default_percentages()}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {invalid && (
        <p role="alert" className="text-sm text-destructive">
          {m.hr_zones_invalid()}
        </p>
      )}

      <div className="sticky -bottom-6 -mb-6 flex justify-end gap-2 bg-background pt-3 pb-6">
        <Button variant="outline" onClick={onComplete} type="button">
          {m.cancel()}
        </Button>
        <Button
          onClick={handleSave}
          disabled={invalid || isSaving}
          isLoading={isSaving}
          type="button"
        >
          {m.save()}
        </Button>
      </div>
    </fieldset>
  );
}

function getDefaultZones(type: TRAINING_ZONE_TYPE): DefaultZone[] {
  switch (type) {
    case TRAINING_ZONE_TYPE.HEARTRATE:
      return DEFAULT_HEART_RATE_PERCENTAGES.map((range, index) => ({
        ...range,
        name: [
          m.hr_zone_0(),
          m.zone_1(),
          m.zone_2(),
          m.zone_3(),
          m.zone_4(),
          m.zone_5(),
        ][index],
        description: '',
        color: [
          '#64748B',
          '#9CA3AF',
          '#22C55E',
          '#EAB308',
          '#F97316',
          '#EF4444',
        ][index],
      }));
    case TRAINING_ZONE_TYPE.POWER:
      return [
        {
          name: m.zone_1(),
          description: m.ui_active_recovery(),
          min: 0,
          max: 140,
          color: '#9CA3AF',
        },
        {
          name: m.zone_2(),
          description: m.endurance(),
          min: 141,
          max: 190,
          color: '#22C55E',
        },
        {
          name: m.zone_3(),
          description: m.tempo(),
          min: 191,
          max: 230,
          color: '#EAB308',
        },
        {
          name: m.zone_4(),
          description: m.threshold(),
          min: 231,
          max: 270,
          color: '#F97316',
        },
        {
          name: m.zone_5(),
          description: m.vo2_max(),
          min: 271,
          max: 320,
          color: '#EF4444',
        },
      ];
    case TRAINING_ZONE_TYPE.PACE:
      return [
        {
          name: m.zone_1(),
          description: m.ui_easy(),
          min: 6.0,
          max: 7.0,
          color: '#9CA3AF',
        },
        {
          name: m.zone_2(),
          description: m.ui_marathon(),
          min: 5.0,
          max: 5.9,
          color: '#22C55E',
        },
        {
          name: m.zone_3(),
          description: m.tempo(),
          min: 4.3,
          max: 4.9,
          color: '#EAB308',
        },
        {
          name: m.zone_4(),
          description: m.threshold(),
          min: 3.8,
          max: 4.2,
          color: '#F97316',
        },
        {
          name: m.zone_5(),
          description: m.ui_interval(),
          min: 3.0,
          max: 3.7,
          color: '#EF4444',
        },
      ];
    default:
      return [];
  }
}
