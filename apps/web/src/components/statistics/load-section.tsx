import { m } from '@/paraglide/messages';

import { SPORT_TYPE } from '@openathlete/shared';

import { TrainingLoadChart } from '../training-load';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

interface P {
  athleteId: number;
  period: Period | null;
  sport: SPORT_TYPE | null;
}

export function LoadSection({ athleteId, period, sport }: P) {
  return (
    <StatSection id="load" title={m.statistics_section_load()}>
      {(visible) => (
        <TrainingLoadChart
          athleteId={athleteId}
          period={period}
          sport={sport}
          enabled={visible}
        />
      )}
    </StatSection>
  );
}
