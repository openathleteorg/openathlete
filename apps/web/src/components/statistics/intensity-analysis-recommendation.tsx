
import {
  Activity,
  ArrowUpRight,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import { getRecommendation } from './intensity-analysis-utils';
import type { IntensityAnalysis } from './intensity-analysis.types';

const CONTENT = {
  BUILD_VOLUME: {
    title: 'Build your aerobic foundation',
    description:
      'Your training distribution suggests that increasing low-intensity running could be beneficial. Focus on building aerobic endurance through consistent, easy running before adding more intensity.',
    icon: TrendingUp,
  },

  EASY_RUNNING: {
    title: 'Increase easy running',
    description:
      'A relatively large share of your training is performed at moderate or high intensity. Consider increasing the proportion of easy running to develop aerobic endurance and create better separation between easy and quality sessions.',
    icon: Activity,
  },

  REDUCE_MODERATE: {
    title: 'Reduce unnecessary moderate intensity',
    description:
      'A large proportion of your training is performed at moderate intensity. Consider making easy runs easier and keeping threshold sessions more structured.',
    icon: Activity,
  },

  ADD_INTENSITY: {
    title: 'Consider structured speed work',
    description:
      'Your training is predominantly low intensity, with relatively little high-intensity work. If this matches your training goals, consider introducing structured interval or speed sessions progressively.',
    icon: ArrowUpRight,
  },

  MAINTAIN_BALANCE: {
    title: 'Maintain your current balance',
    description:
      'Your training distribution follows a coherent intensity pattern. Continue progressing gradually and adapt your training balance to your running goals.',
    icon: ShieldCheck,
  },
} as const;

export function IntensityAnalysisRecommendation({
  analysis,
}: {
  analysis: IntensityAnalysis;
}) {
  const key = getRecommendation(analysis);
  const recommendation = CONTENT[key];
  const Icon = recommendation.icon;

  return (
    <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-5 text-primary" />
        <h3 className="font-semibold">
          Training recommendation
        </h3>
      </div>

      <div className="flex items-start gap-3">
        <Icon className="mt-1 size-5 shrink-0 text-primary" />

        <div className="space-y-1">
          <p className="font-medium">
            {recommendation.title}
          </p>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {recommendation.description}
          </p>
        </div>
      </div>
    </div>
  );
}

