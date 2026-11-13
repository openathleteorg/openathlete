import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { ArrowRight } from 'lucide-react';

import { ActivityEvent, activityAiSummarySchema } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * What the AI read in the activity: why it went the way it did, with the
 * figures behind it, and what to do next. Written in the background once
 * the activity is processed, when the athlete or a coach has AI.
 */
export function AiSummaryCard({ event }: { event: ActivityEvent }) {
  const parsed = activityAiSummarySchema.safeParse(event.aiSummary);
  if (!parsed.success) return null;
  const { headline, points, suggestion } = parsed.data;

  return (
    <Card className="col-span-2" data-ai-summary>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <SparklesIcon className="size-4" />
          {m.activity_ai_summary_title()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="font-medium">{headline}</p>
        {points.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
        {suggestion && (
          <p className="flex items-start gap-2 rounded-md bg-muted/60 p-2">
            <ArrowRight className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">
                {m.activity_ai_summary_next()}{' '}
              </span>
              {suggestion}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
