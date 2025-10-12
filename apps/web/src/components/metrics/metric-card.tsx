import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { AthleteMetric } from '@/services/metric';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { cn } from '@/utils/shadcn';
import { format } from 'date-fns';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { METRIC_TYPE, metricUnitMap } from '@openathlete/shared';

interface MetricCardProps {
  metric: AthleteMetric | null;
  type: METRIC_TYPE;
  onClick?: () => void;
  previousValue?: number;
  className?: string;
}

export function MetricCard({
  metric,
  type,
  onClick,
  previousValue,
  className,
}: MetricCardProps) {
  const label = metricTypeLabelMap[type];
  const unit = metricUnitMap[type];

  const trend =
    metric && previousValue !== undefined
      ? metric.value > previousValue
        ? 'up'
        : metric.value < previousValue
          ? 'down'
          : 'stable'
      : null;

  return (
    <Card
      className={cn('cursor-pointer transition-all hover:shadow-md', className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
      </CardHeader>
      <CardContent>
        {metric ? (
          <>
            <div className="text-2xl font-bold">
              {metric.value} <span className="text-sm font-normal">{unit}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(metric.date), 'PPP')}
            </p>
            {metric.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {metric.notes}
              </p>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            {m.no_data_for_metric()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
