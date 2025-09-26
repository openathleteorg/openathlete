import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCallback, useState } from 'react';

import {
  type RacePlanVisualizationExport,
  formatDuration,
} from '@openathlete/shared';

import { AltitudeProfile } from './components/altitude-profile';
import { PlanMap } from './components/plan-map';

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
          <SummaryPanel plan={loaded.data} />
          <PlanMap plan={loaded.data} focusLegIndex={0} />
          <AltitudeProfile plan={loaded.data} />
          <CrewNutritionPanel plan={loaded.data} />
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
          value={`${plan.nutrition.totals.carbsTargetG.toFixed(0)} g`}
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
          const raceLeg = raceLegs.find((l, index) => index === leg.legIndex);
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
                      {formatG(leg.carbsViaFoodsG)})
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
