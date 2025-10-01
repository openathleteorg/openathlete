import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCallback, useState } from 'react';

import {
  type RacePlanVisualizationExport,
  formatDuration,
} from '@openathlete/shared';

import { AltitudeProfile } from './components/altitude-profile';
import { DayNightTimeline } from './components/day-night-timeline';
import { LegsTable } from './components/legs-table';
import { NotesPanel } from './components/notes-panel';
import { PlanMap } from './components/plan-map';
import { TemperatureProfile } from './components/temperature-profile';
import { WeatherCharts } from './components/weather-charts';

interface LoadedPlan {
  data: RacePlanVisualizationExport;
  fileName?: string;
}

export default function RacePlanViewerView() {
  const [loaded, setLoaded] = useState<LoadedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        validate(json);
        setLoaded({ data: json, fileName: file.name });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Invalid JSON');
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Race Plan Viewer</h1>
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-medium">Importer un export JSON</h2>
        <div className="flex flex-col gap-2">
          <Input
            type="file"
            accept="application/json,.json"
            onChange={onFileChange}
          />
          {error && (
            <div className="rounded border border-destructive/50 bg-destructive/10 text-destructive text-sm p-2">
              <strong className="mr-1">Erreur:</strong> {error}
            </div>
          )}
        </div>
      </Card>
      {loaded && (
        <div className="space-y-6">
          <NotesPanel plan={loaded.data} />
          <SummaryPanel plan={loaded.data} />
          <PlanMap plan={loaded.data} focusLegIndex={0} />
          <AltitudeProfile plan={loaded.data} />
          <TemperatureProfile plan={loaded.data} />
          <DayNightTimeline plan={loaded.data} />
          <WeatherCharts plan={loaded.data} />
          <LegsTable plan={loaded.data} />
          <CrewNutritionPanel plan={loaded.data} />
          <ShoppingNutritionPanel plan={loaded.data} />
        </div>
      )}
    </div>
  );
}

function SummaryPanel({ plan }: { plan: RacePlanVisualizationExport }) {
  const legs = plan.legs.length;
  return (
    <Card className="p-4 space-y-2">
      <h3 className="font-medium">Résumé</h3>
      <div className="grid gap-2 text-sm md:grid-cols-3 lg:grid-cols-5">
        <Stat
          label="Distance"
          value={`${plan.derived.distanceKm.toFixed(1)} km`}
        />
        <Stat
          label="D+ / D-"
          value={`+${plan.derived.elevationGainM.toFixed(0)} / -${plan.derived.elevationLossM.toFixed(0)} m`}
        />
        <Stat label="Segments" value={plan.segments.length.toString()} />
        <Stat label="Sections (legs)" value={legs.toString()} />
        <Stat
          label="CHO totaux"
          value={`${plan.nutrition.totals.carbsTargetG.toFixed(0)} g (${(plan.nutrition.totals.carbsTargetG / (plan.derived.totalDurationSec / 3600)).toFixed(0)} g/h)`}
        />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function validate(obj: any): asserts obj is RacePlanVisualizationExport {
  if (!obj || typeof obj !== 'object') throw new Error('Not an object');
  if (!obj.meta || obj.meta.version !== 1)
    throw new Error('Unsupported version');
  if (!Array.isArray(obj.points) || !Array.isArray(obj.segments))
    throw new Error('Missing arrays');
}

function CrewNutritionPanel({ plan }: { plan: RacePlanVisualizationExport }) {
  const legs = plan.nutrition?.perLeg ?? [];
  const raceLegs = plan.legs;
  if (!legs.length) return null;

  const formatL = (litres?: number) =>
    litres == null ? '—' : `${litres.toFixed(1)} L`;
  const formatG = (g?: number) => (g == null ? '—' : `${g.toFixed(0)} g`);
  const formatMl = (ml?: number) => (ml == null ? '—' : `${ml} ml`);

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-medium">Nutrition par section (ravitailleur)</h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {legs.map((leg) => {
          const foods = leg.selectedFoods || [];
          const raceLeg = raceLegs.find((_, index) => index === leg.legIndex);
          return (
            <div
              key={leg.legIndex}
              className="rounded-md border bg-card text-card-foreground shadow-sm p-3 space-y-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-semibold">
                  {leg.legIndex + 1}. {leg.legName} (
                  {((raceLeg?.distanceM ?? 0) / 1000).toFixed(1)} km,{' '}
                  {formatDuration(raceLeg?.totalTimeSec || 0)})
                </div>
                <div className="text-xs text-muted-foreground">
                  Objectif CHO: {formatG(leg.carbsTargetG)}
                </div>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Au départ</span>
                  <span>
                    {leg.pickupAtStart?.flasksToFill
                      ? `Remplir ${leg.pickupAtStart.flasksToFill} flasque(s) (${formatMl(
                          leg.pickupAtStart.fillVolumeMl,
                        )})`
                      : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Hydratation portée
                  </span>
                  <span>
                    {formatL(leg.carryLitres)} · {leg.flasksCount} flasque(s)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    CHO via flasques
                  </span>
                  <span>{formatG(leg.carbsViaFlasksG)}</span>
                </div>

                <div>
                  <div className="text-muted-foreground">Solides à donner</div>
                  {foods.length ? (
                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                      {foods.map((f, i) => (
                        <li key={i} className="text-sm">
                          {f.units}× {f.label} ({formatG(f.carbsG)})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm">—</div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Temps au ravitaillement
                  </span>
                  <span>{formatDuration(raceLeg?.stopTimeSec || 0)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t mt-2">
                  <span className="text-muted-foreground">
                    Total CHO section
                  </span>
                  <span>
                    {formatG(leg.carbsTargetG)}{' '}
                    <span className="text-xs text-muted-foreground">
                      (flasques {formatG(leg.carbsViaFlasksG)} + solides{' '}
                      {formatG(leg.carbsViaFoodsG)}) {' -> '}
                      {formatG(
                        leg.carbsTargetG / (raceLeg?.totalTimeSec! / (60 * 60)),
                      )}
                      /h
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ShoppingNutritionPanel({
  plan,
}: {
  plan: RacePlanVisualizationExport;
}) {
  const legs = plan.nutrition?.perLeg ?? [];
  if (!legs.length) return null;

  // Aggregate solids by label across all legs
  const solidsMap = new Map<string, { units: number; carbsG: number }>();
  let totalSolidsCarbsG = 0;
  for (const leg of legs) {
    totalSolidsCarbsG += leg.carbsViaFoodsG || 0;
    for (const f of leg.selectedFoods || []) {
      const prev = solidsMap.get(f.label) || { units: 0, carbsG: 0 };
      solidsMap.set(f.label, {
        units: prev.units + (f.units || 0),
        carbsG: prev.carbsG + (f.carbsG || 0),
      });
    }
  }

  const solids = Array.from(solidsMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const totalLiquidCarbsG = plan.nutrition.totals.carbsViaFlasksG || 0;
  const totalHydrationL = plan.nutrition.totals.hydrationLitres || 0;

  // Simple calculator: estimate number of drink mix sachets (by CHO per sachet)
  const [carbsPerSachetG, setCarbsPerSachetG] = useState<number>(44);
  const estimatedSachets =
    carbsPerSachetG > 0 ? Math.ceil(totalLiquidCarbsG / carbsPerSachetG) : 0;

  const fmtG = (g: number) => `${g.toFixed(0)} g`;
  const fmtL = (l: number) => `${l.toFixed(1)} L`;

  const totalTime =
    plan.legs.reduce((sum, leg) => sum + (leg.totalTimeSec || 0), 0) / 3600;
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-medium">Liste d'achats nutrition</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Boisson énergétique (liquide)
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Glucides à prévoir
              </span>
              <span className="font-medium">{fmtG(totalLiquidCarbsG)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Hydratation totale
              </span>
              <span className="font-medium">
                {fmtL(totalHydrationL)} ({fmtL(totalHydrationL / totalTime)}/h)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-muted-foreground">g CHO par sachet</label>
            <Input
              type="number"
              value={carbsPerSachetG}
              onChange={(e) => setCarbsPerSachetG(Number(e.target.value) || 0)}
              className="w-24 h-8"
            />
            <div className="ml-auto">
              ≈ <span className="font-medium">{estimatedSachets}</span>{' '}
              sachet(s)
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Solides (gels, barres, purées, etc.)
          </div>
          {solids.length ? (
            <ul className="text-sm divide-y rounded-md border">
              {solids.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="truncate">
                    <span className="font-medium">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="text-muted-foreground">{s.units}×</span>
                    <span className="text-muted-foreground">
                      {fmtG(s.carbsG)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm">Aucun solide sélectionné</div>
          )}
          <div className="text-sm flex items-center justify-between pt-2">
            <span className="text-muted-foreground">
              Total glucides solides
            </span>
            <span className="font-medium">{fmtG(totalSolidsCarbsG)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
