import { Map } from '@/components/map/map';
import { useMemo } from 'react';

import type { RacePlanVisualizationExport } from '@openathlete/shared';

interface P {
  plan: RacePlanVisualizationExport;
  focusLegIndex?: number;
}

export function PlanMap({ plan, focusLegIndex }: P) {
  const polyline = useMemo(
    () => plan.points.map((p) => [p.lat, p.lon] as [number, number]),
    [plan.points],
  );
  const pins = useMemo(
    () => plan.stops.map((s) => [s.lat, s.lon] as [number, number]),
    [plan.stops],
  );
  const focusPolyline = useMemo(() => {
    if (
      focusLegIndex === undefined ||
      focusLegIndex < 0 ||
      focusLegIndex >= plan.legs.length
    ) {
      return undefined;
    }
    console.log('focusLegIndex', plan);
  }, [focusLegIndex, plan.legs, plan.points]);

  return (
    <Map
      polyline={polyline}
      className="h-80 rounded-xl shadow-sm border"
      pins={pins}
      focusPolyline={focusPolyline}
    />
  );
}
