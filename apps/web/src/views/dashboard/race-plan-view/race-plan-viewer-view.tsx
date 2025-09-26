import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCallback, useState } from 'react';

import type { RacePlanVisualizationExport } from '@openathlete/shared';

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
