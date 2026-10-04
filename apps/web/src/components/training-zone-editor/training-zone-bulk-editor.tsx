import { useGetLatestMetricsQuery } from '@/api/metric';
import {
  useCreateTrainingZone,
  useDeleteTrainingZone,
  useUpdateTrainingZone,
} from '@/api/training-zone';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { m } from '@/paraglide/messages';
import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  METRIC_TYPE,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  TrainingZone,
  TrainingZoneValue,
} from '@openathlete/shared';

import { ColorPicker } from './color-picker';
import {
  DEFAULT_HEART_RATE_PERCENTAGES,
  heartRateToPercentage,
  isValidMaxHeartRate,
  isValidRestingHeartRate,
  percentageToHeartRate,
} from './heart-rate-percentages';
import { MultiSportSelector } from './multi-sport-selector';

interface ZoneConfig {
  id?: number; // existing zone ID or undefined for new zones
  name: string;
  description: string;
  min: number;
  max: number;
  color: string;
  sports: SPORT_TYPE[];
}

interface TrainingZoneBulkEditorProps {
  athleteId: number;
  type: TRAINING_ZONE_TYPE;
  zones: (TrainingZone & { values: TrainingZoneValue[] })[];
  onComplete: () => void;
}

const ALL_SPORTS = Object.values(SPORT_TYPE);

const DEFAULT_COLORS = [
  '#9CA3AF', // gray-400
  '#22C55E', // green-500
  '#EAB308', // yellow-500
  '#F97316', // orange-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
];

// Helper functions for zone management
function getStepForType(type: TRAINING_ZONE_TYPE): number {
  switch (type) {
    case TRAINING_ZONE_TYPE.HEARTRATE:
      return 1; // 1 BPM
    case TRAINING_ZONE_TYPE.POWER:
      return 1; // 1 Watt
    case TRAINING_ZONE_TYPE.PACE:
      return 0.1; // 0.1 min/km
    default:
      return 1;
  }
}

function getUnitLabel(type: TRAINING_ZONE_TYPE): string {
  switch (type) {
    case TRAINING_ZONE_TYPE.HEARTRATE:
      return m.bpm();
    case TRAINING_ZONE_TYPE.POWER:
      return m.watts();
    case TRAINING_ZONE_TYPE.PACE:
      return m.per_km().replace('/', ''); // "min/km"
    default:
      return '';
  }
}

export function TrainingZoneBulkEditor({
  athleteId,
  type,
  zones: existingZones,
  onComplete,
}: TrainingZoneBulkEditorProps) {
  const isHeartRate = type === TRAINING_ZONE_TYPE.HEARTRATE;
  const [percentageMode, setPercentageMode] = useState(
    isHeartRate && existingZones.length === 0,
  );
  // Initialize once: mutation invalidations must not overwrite unsaved edits.
  const [zones, setZones] = useState<ZoneConfig[]>(() =>
    existingZones.length
      ? existingZones.map((zone) => ({
          id: zone.trainingZoneId,
          name: zone.name,
          description: zone.description,
          min: zone.values[0]?.min ?? 0,
          max: zone.values[0]?.max ?? 0,
          color: zone.color,
          sports: (zone.values[0]?.sports as SPORT_TYPE[]) ?? ALL_SPORTS,
        }))
      : getDefaultZones(type),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hrMaxInput, setHrMaxInput] = useState<string>();
  const [hrRestInput, setHrRestInput] = useState<string>();
  const [reserveMode, setReserveMode] = useState(false);
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
  // Never treat a missing resting HR as zero when reserve mode is selected.
  const calculationRest = reserveMode ? hrRest : 0;
  const deletedIds = useRef(new Set<number>());

  const createZone = useCreateTrainingZone();
  const updateZone = useUpdateTrainingZone();
  const deleteZone = useDeleteTrainingZone();

  let convertedZones = zones;
  let invalid = zones.some(
    (zone) =>
      !zone.name.trim() ||
      !Number.isFinite(zone.min) ||
      !Number.isFinite(zone.max) ||
      zone.min < 0 ||
      zone.min > zone.max,
  );
  if (percentageMode) {
    if (reserveMode && !isValidRestingHeartRate(hrRest, hrMax)) invalid = true;
    try {
      convertedZones = zones.map((zone) => ({
        ...zone,
        ...percentageToHeartRate(zone, hrMax, calculationRest),
      }));
    } catch {
      invalid = true;
    }
  }

  const changeMode = (nextMode: 'bpm' | 'max' | 'reserve') => {
    const nextPercentageMode = nextMode !== 'bpm';
    const nextReserveMode = nextMode === 'reserve';
    if (
      percentageMode === nextPercentageMode &&
      (!nextPercentageMode || reserveMode === nextReserveMode)
    )
      return;
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
        setZones(
          zones.map((zone) => ({
            ...zone,
            ...(nextPercentageMode
              ? heartRateToPercentage(zone, hrMax, nextReserveMode ? hrRest : 0)
              : percentageToHeartRate(zone, hrMax, calculationRest)),
          })),
        );
      }
      setPercentageMode(nextPercentageMode);
      setReserveMode(nextReserveMode);
      setPendingMode(null);
      setError('');
    } catch {
      if (!percentageMode && nextMode !== 'bpm') setPendingMode(nextMode);
      setError(m.hr_zones_conversion_error());
    }
  };

  const handleAddZone = () => {
    const lastZone = zones[zones.length - 1];
    const newMin = lastZone ? lastZone.max + (percentageMode ? 0 : 1) : 0;
    setZones([
      ...zones,
      {
        name: `${m.zone()} ${zones.length + (percentageMode ? 0 : 1)}`,
        description: '',
        min: newMin,
        max: percentageMode ? Math.min(100, newMin + 10) : newMin + 10,
        color: DEFAULT_COLORS[zones.length % DEFAULT_COLORS.length],
        sports: ALL_SPORTS,
      },
    ]);
  };

  const handleRemoveZone = (index: number) => {
    const newZones = zones.filter((_, i) => i !== index);
    setZones(newZones);
  };

  const handleZoneChange = (
    index: number,
    field: keyof ZoneConfig,
    value: number | string | SPORT_TYPE[],
  ): void => {
    setError('');
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], [field]: value };

    // Get step value for this type
    const step = percentageMode ? 0 : getStepForType(type);

    // Smart adjustment: if max changes, adjust next zone's min
    if (field === 'max' && index < zones.length - 1) {
      const numValue =
        typeof value === 'number' ? value : parseFloat(value as string);
      if (!Number.isNaN(numValue)) {
        newZones[index + 1] = {
          ...newZones[index + 1],
          min: numValue + step,
        };
      }
    }

    // Smart adjustment: if min changes, adjust previous zone's max
    if (field === 'min' && index > 0) {
      const numValue =
        typeof value === 'number' ? value : parseFloat(value as string);
      if (!Number.isNaN(numValue)) {
        newZones[index - 1] = {
          ...newZones[index - 1],
          max: numValue - step,
        };
      }
    }

    setZones(newZones);
  };

  const handleSave = async () => {
    if (invalid || isSaving) return;
    setError('');
    setIsSaving(true);
    try {
      // Identify zones to delete (existing zones not in current list)
      const currentIds = zones.map((z) => z.id).filter(Boolean);
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
      for (let i = 0; i < zones.length; i++) {
        const zone = convertedZones[i];
        if (zone.id) {
          // Update existing
          await updateZone.mutateAsync({
            trainingZoneId: zone.id,
            body: {
              name: zone.name,
              description: zone.description,
              min: zone.min,
              max: zone.max,
              color: zone.color,
              sports: zone.sports,
            },
          });
        } else {
          // Create new
          const created = await createZone.mutateAsync({
            athleteId,
            name: zone.name,
            description: zone.description,
            type,
            min: zone.min,
            max: zone.max,
            color: zone.color,
            sports: zone.sports,
          });
          setZones((current) =>
            current.map((item, index) =>
              index === i ? { ...item, id: created.trainingZoneId } : item,
            ),
          );
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
    <>
      <div className="space-y-2">
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
        <div className="space-y-2">
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
          <p className="text-sm text-muted-foreground">
            {m.hr_zones_resting_help()}
          </p>
        </div>
      )}
    </>
  );

  return (
    <fieldset disabled={isSaving} className="space-y-6 min-w-0">
      {isHeartRate && (
        <div className="space-y-3 rounded-lg border p-4">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={m.hr_zones_input_mode()}
          >
            <Button
              type="button"
              className="min-h-11 md:min-h-9"
              variant={percentageMode ? 'outline' : 'default'}
              aria-pressed={!percentageMode}
              onClick={() => changeMode('bpm')}
            >
              {m.hr_zones_manual()}
            </Button>
            <Button
              type="button"
              className="min-h-11 md:min-h-9"
              variant={percentageMode && reserveMode ? 'default' : 'outline'}
              aria-pressed={percentageMode && reserveMode}
              onClick={() => changeMode('reserve')}
            >
              {m.hr_zones_reserve_percent()}
            </Button>
            <Button
              type="button"
              className="min-h-11 md:min-h-9"
              variant={percentageMode && !reserveMode ? 'default' : 'outline'}
              aria-pressed={percentageMode && !reserveMode}
              onClick={() => changeMode('max')}
            >
              {m.percent_of_max_heart_rate()}
            </Button>
          </div>
          {percentageMode && referenceFields(reserveMode)}
          {percentageMode && (
            <p className="text-sm text-muted-foreground">
              {m.hr_zones_percentage_help()}
            </p>
          )}
          {percentageMode && reserveMode && (
            <p className="text-sm">{m.hr_zones_reserve_formula()}</p>
          )}
          {percentageMode &&
            reserveMode &&
            !isValidRestingHeartRate(hrRest, hrMax) && (
              <p role="alert" className="text-sm text-destructive">
                {m.hr_zones_rest_required()}
              </p>
            )}
          {percentageMode && (zones.length === 5 || zones.length === 6) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const defaults = DEFAULT_HEART_RATE_PERCENTAGES.slice(
                  zones.length === 5 ? 1 : 0,
                );
                setZones(
                  zones.map((zone, index) => ({ ...zone, ...defaults[index] })),
                );
                setError('');
              }}
            >
              {m.hr_zones_default_percentages()}
            </Button>
          )}
          {percentageMode && !isValidMaxHeartRate(hrMax) && (
            <p role="alert" className="text-sm text-destructive">
              {m.hr_zones_max_required()}
            </p>
          )}
        </div>
      )}
      <Dialog
        open={pendingMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingMode(null);
            setError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingMode === 'reserve'
                ? m.hr_zones_reserve_percent()
                : m.percent_of_max_heart_rate()}
            </DialogTitle>
          </DialogHeader>
          {referenceFields(pendingMode === 'reserve')}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
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
            <Button
              type="button"
              onClick={() => {
                if (pendingMode) changeMode(pendingMode);
              }}
            >
              {m.hr_zones_convert_limits()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-4">
        {zones.map((zone, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg space-y-4 relative group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`zone-${index}-name`}>{m.name()}</Label>
                  <Input
                    id={`zone-${index}-name`}
                    value={zone.name}
                    onChange={(e) =>
                      handleZoneChange(index, 'name', e.target.value)
                    }
                    placeholder={m.zone_name()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`zone-${index}-description`}>
                    {m.description()}
                  </Label>
                  <Input
                    id={`zone-${index}-description`}
                    value={zone.description}
                    onChange={(e) =>
                      handleZoneChange(index, 'description', e.target.value)
                    }
                    placeholder={m.optional()}
                  />
                </div>
              </div>
              {zones.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label={`${m.delete_()} ${zone.name}`}
                  type="button"
                  onClick={() => handleRemoveZone(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`zone-${index}-min`}>
                  {m.minimum()} ({percentageMode ? '%' : getUnitLabel(type)})
                </Label>
                <Input
                  id={`zone-${index}-min`}
                  type="number"
                  step={percentageMode ? 0.01 : getStepForType(type)}
                  min={0}
                  max={percentageMode ? 100 : undefined}
                  value={Number.isNaN(zone.min) ? '' : zone.min}
                  onChange={(e) =>
                    handleZoneChange(index, 'min', parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`zone-${index}-max`}>
                  {m.maximum()} ({percentageMode ? '%' : getUnitLabel(type)})
                </Label>
                <Input
                  id={`zone-${index}-max`}
                  type="number"
                  step={percentageMode ? 0.01 : getStepForType(type)}
                  min={0}
                  max={percentageMode ? 100 : undefined}
                  value={Number.isNaN(zone.max) ? '' : zone.max}
                  onChange={(e) =>
                    handleZoneChange(index, 'max', parseFloat(e.target.value))
                  }
                  placeholder={
                    !isHeartRate && index === zones.length - 1
                      ? m.maximum_or_more()
                      : undefined
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`zone-${index}-color`}>{m.color()}</Label>
                <ColorPicker
                  value={zone.color}
                  onChange={(color) => handleZoneChange(index, 'color', color)}
                />
              </div>
            </div>

            {percentageMode && !invalid && (
              <p className="text-sm" data-testid="hr-zone-preview">
                {convertedZones[index].min}–{convertedZones[index].max}{' '}
                {m.bpm()}
              </p>
            )}
            <div className="space-y-2">
              <Label>{m.sports()}</Label>
              <MultiSportSelector
                value={zone.sports}
                onChange={(sports) => handleZoneChange(index, 'sports', sports)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleAddZone}
        disabled={percentageMode && zones[zones.length - 1]?.max >= 100}
        type="button"
      >
        <Plus className="h-4 w-4 mr-2" />
        {m.add_zone()}
      </Button>

      {error && !pendingMode && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {invalid && (
        <p role="alert" className="text-sm text-destructive">
          {m.hr_zones_invalid()}
        </p>
      )}
      <Separator />

      <div className="flex justify-end gap-2">
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

function getDefaultZones(type: TRAINING_ZONE_TYPE): ZoneConfig[] {
  const allSports = Object.values(SPORT_TYPE);

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
        sports: allSports,
      }));
    case TRAINING_ZONE_TYPE.POWER:
      return [
        {
          name: m.zone_1(),
          description: m.ui_active_recovery(),
          min: 0,
          max: 140,
          color: '#9CA3AF',
          sports: allSports,
        },
        {
          name: m.zone_2(),
          description: m.endurance(),
          min: 141,
          max: 190,
          color: '#22C55E',
          sports: allSports,
        },
        {
          name: m.zone_3(),
          description: m.tempo(),
          min: 191,
          max: 230,
          color: '#EAB308',
          sports: allSports,
        },
        {
          name: m.zone_4(),
          description: m.threshold(),
          min: 231,
          max: 270,
          color: '#F97316',
          sports: allSports,
        },
        {
          name: m.zone_5(),
          description: m.vo2_max(),
          min: 271,
          max: 320,
          color: '#EF4444',
          sports: allSports,
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
          sports: allSports,
        },
        {
          name: m.zone_2(),
          description: m.ui_marathon(),
          min: 5.0,
          max: 5.9,
          color: '#22C55E',
          sports: allSports,
        },
        {
          name: m.zone_3(),
          description: m.tempo(),
          min: 4.3,
          max: 4.9,
          color: '#EAB308',
          sports: allSports,
        },
        {
          name: m.zone_4(),
          description: m.threshold(),
          min: 3.8,
          max: 4.2,
          color: '#F97316',
          sports: allSports,
        },
        {
          name: m.zone_5(),
          description: m.ui_interval(),
          min: 3.0,
          max: 3.7,
          color: '#EF4444',
          sports: allSports,
        },
      ];
    default:
      return [];
  }
}
