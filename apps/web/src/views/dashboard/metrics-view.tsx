import { MetricCard } from '@/components/metrics/metric-card';
import { MetricChart } from '@/components/metrics/metric-chart';
import { MetricForm } from '@/components/metrics/metric-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import {
  AthleteMetric,
  useCreateMetricMutation,
  useGetLatestMetricsQuery,
} from '@/api/metric';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
  CreateMetricDto,
  METRIC_TYPE,
  metricsByCategory,
} from '@openathlete/shared';

interface P {
  athleteId?: number;
}

export function MetricsView({ athleteId }: P) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{
    type: METRIC_TYPE;
    data: AthleteMetric | null;
  } | null>(null);

  const { data: latestMetrics = {} } = useGetLatestMetricsQuery(athleteId);
  const createMetric = useCreateMetricMutation();
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const handleMetricCardClick = (type: METRIC_TYPE) => {
    setSelectedMetric({
      type,
      data: latestMetrics[type] || null,
    });
    setIsDialogOpen(true);
  };

  const handleAddNewMetric = () => {
    setSelectedMetric(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: CreateMetricDto) => {
    await createMetric.mutateAsync({ body: values, athleteId });
    setIsDialogOpen(false);
    setSelectedMetric(null);
  };

  // Display metrics in organized categories - showing first 5 from each category
  const healthMetrics = metricsByCategory.health_composition.slice(0, 5);
  const cardiacMetrics = metricsByCategory.cardiac;
  const performanceMetrics = metricsByCategory.performance_physiology.slice(
    0,
    4,
  );

  const pageTitle = isCurrentUser
    ? m.my_metrics()
    : m.metrics_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{pageTitle}</h1>
        <Button onClick={handleAddNewMetric}>
          <Plus className="h-4 w-4 mr-2" />
          {m.add_metric()}
        </Button>
      </div>

      {/* Health & Body Composition Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{m.health_composition()}</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {healthMetrics.map((type) => (
            <MetricCard
              key={type}
              type={type}
              metric={latestMetrics[type] || null}
              onClick={() => handleMetricCardClick(type)}
            />
          ))}
        </div>
      </div>

      {/* Cardiac Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{m.cardiac()}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cardiacMetrics.map((type) => (
            <MetricCard
              key={type}
              type={type}
              metric={latestMetrics[type] || null}
              onClick={() => handleMetricCardClick(type)}
            />
          ))}
        </div>
      </div>

      {/* Performance Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {m.performance_physiology()}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {performanceMetrics.map((type) => (
            <MetricCard
              key={type}
              type={type}
              metric={latestMetrics[type] || null}
              onClick={() => handleMetricCardClick(type)}
            />
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>{m.metrics()} - Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricChart athleteId={athleteId} />
        </CardContent>
      </Card>

      {/* Dialog for adding/editing metric */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMetric ? m.edit_metric() : m.add_metric()}
            </DialogTitle>
          </DialogHeader>
          <MetricForm
            onSubmit={handleSubmit}
            defaultValues={
              selectedMetric
                ? {
                    type: selectedMetric.type,
                    value: selectedMetric.data?.value,
                    date: selectedMetric.data?.date,
                    notes: selectedMetric.data?.notes || undefined,
                  }
                : undefined
            }
            hideTypeSelector={!!selectedMetric}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
