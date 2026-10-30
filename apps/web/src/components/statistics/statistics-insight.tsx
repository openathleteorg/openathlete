import { useStatisticsOverviewQuery } from '@/api/statistics';
import { InsightBanner } from '@/components/ui/insight-banner';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { getDominantSport } from '@/utils/insights';
import { sportTypeLabelMap } from '@/utils/label-map/core';

import { SPORT_TYPE } from '@openathlete/shared';

interface P {
  athleteId: number;
  period: { start: Date; end: Date } | null | undefined;
  sport?: SPORT_TYPE | null;
}

/** Hidden on one sport: the sentence compares sports with each other */
export function StatisticsInsight({ athleteId, period, sport }: P) {
  const { openChat } = useChatbot();
  const { data: overview } = useStatisticsOverviewQuery(
    {
      athleteId,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    !!period && !sport,
  );
  const dominant = !sport && overview && getDominantSport(overview.sports);
  if (!dominant) return null;

  return (
    <InsightBanner
      text={m.insight_dominant_sport({
        sport: sportTypeLabelMap[dominant.sport.sport],
        share: Math.round(dominant.share * 100),
      })}
      actions={[{ label: m.insight_ask_coach(), onClick: openChat }]}
    />
  );
}
