import {
  AthleteMetric,
  useCreateMetricMutation,
  useGetLatestMetricsQuery,
} from '@/api/metric';
import { InjuryLogsTable } from '@/components/metrics/injury-logs-table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
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
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const { data: latestMetrics = {}, isPending: isLoadingMetrics } =
    useGetLatestMetricsQuery(athleteId);
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

  // Sort metrics: non-null first, then by original order
  const sortMetrics = (
    metrics: METRIC_TYPE[],
    latestMetrics: Record<string, AthleteMetric | null>,
  ): METRIC_TYPE[] => {
    return [...metrics].sort((a, b) => {
      const aHasData =
        latestMetrics[a] !== null && latestMetrics[a] !== undefined;
      const bHasData =
        latestMetrics[b] !== null && latestMetrics[b] !== undefined;

      // Non-null first
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;

      // Then maintain original order (by index in original array)
      return metrics.indexOf(a) - metrics.indexOf(b);
    });
  };

  // Get sorted and limited metrics for each category
  const getMetricsForCategory = (
    categoryKey: string,
    allMetrics: METRIC_TYPE[],
  ) => {
    const sorted = sortMetrics(allMetrics, latestMetrics);
    const isExpanded = expandedCategories[categoryKey] || false;
    const displayed = isExpanded ? sorted : sorted.slice(0, 8);
    const hasMore = sorted.length > 8;

    return { sorted, displayed, hasMore };
  };

  const healthMetricsData = getMetricsForCategory(
    'health_composition',
    metricsByCategory.health_composition,
  );
  const cardiacMetricsData = getMetricsForCategory(
    'cardiac',
    metricsByCategory.cardiac,
  );
  const performanceMetricsData = getMetricsForCategory(
    'performance_physiology',
    metricsByCategory.performance_physiology,
  );

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{m.health_composition()}</h2>
          {healthMetricsData.hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory('health_composition')}
            >
              {expandedCategories['health_composition'] ? (
                <>
                  {m.show_less_metrics()}
                  <ChevronUp className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  {m.show_all_metrics()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingMetrics
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            : healthMetricsData.displayed.map((type) => (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{m.cardiac()}</h2>
          {cardiacMetricsData.hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory('cardiac')}
            >
              {expandedCategories['cardiac'] ? (
                <>
                  {m.show_less_metrics()}
                  <ChevronUp className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  {m.show_all_metrics()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingMetrics
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            : cardiacMetricsData.displayed.map((type) => (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {m.performance_physiology()}
          </h2>
          {performanceMetricsData.hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory('performance_physiology')}
            >
              {expandedCategories['performance_physiology'] ? (
                <>
                  {m.show_less_metrics()}
                  <ChevronUp className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  {m.show_all_metrics()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingMetrics
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            : performanceMetricsData.displayed.map((type) => (
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

      {/* Injury Logs Section */}
      <InjuryLogsTable athleteId={athleteId} />

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
            isLoading={createMetric.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
