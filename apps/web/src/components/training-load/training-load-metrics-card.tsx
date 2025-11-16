import {
  TrainingLoadCalculationType,
  useTrainingLoadMetrics,
} from '@/api/training-load';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { useState } from 'react';

const CALCULATION_TYPE_LABELS: Record<TrainingLoadCalculationType, string> = {
  [TrainingLoadCalculationType.FOSTER_RPE]: 'Foster (RPE)',
  [TrainingLoadCalculationType.TRIMP_EDWARDS]: 'TRIMP Edwards',
  [TrainingLoadCalculationType.TRIMP_BANISTER]: 'TRIMP Banister',
};

export function TrainingLoadMetricsCard({ athleteId }: { athleteId?: number }) {
  const [calculationType, setCalculationType] =
    useState<TrainingLoadCalculationType>(
      TrainingLoadCalculationType.FOSTER_RPE,
    );

  const { data: metrics, isLoading } = useTrainingLoadMetrics(
    calculationType,
    undefined,
    athleteId,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'text-green-600 bg-green-50';
      case 'overreaching':
        return 'text-orange-600 bg-orange-50';
      case 'detraining':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <ActivityIcon className="h-4 w-4" />;
      case 'overreaching':
        return <TrendingUpIcon className="h-4 w-4" />;
      case 'detraining':
        return <TrendingDownIcon className="h-4 w-4" />;
      default:
        return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'Optimal';
      case 'overreaching':
        return 'Surcharge';
      case 'detraining':
        return 'Désentraînement';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Charge d'entraînement
        </CardTitle>
        <Select
          value={calculationType}
          onValueChange={(value) =>
            setCalculationType(value as TrainingLoadCalculationType)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CALCULATION_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : metrics ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(metrics.status)}`}
            >
              {getStatusIcon(metrics.status)}
              {getStatusText(metrics.status)}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ATL (7j)</p>
                <p className="text-2xl font-bold">{metrics.atl.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Fatigue</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">CTL (42j)</p>
                <p className="text-2xl font-bold">{metrics.ctl.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Forme</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">TSB</p>
                <p
                  className={`text-2xl font-bold ${
                    metrics.tsb < -10
                      ? 'text-orange-600'
                      : metrics.tsb > 25
                        ? 'text-blue-600'
                        : 'text-green-600'
                  }`}
                >
                  {metrics.tsb > 0 ? '+' : ''}
                  {metrics.tsb.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Balance</p>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Charge totale ({metrics.trainingDays} jours)
                </span>
                <span className="font-medium">
                  {metrics.totalLoad.toFixed(0)}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>
                  Recommandation semaine prochaine:{' '}
                  <span className="font-medium text-foreground">
                    {metrics.recommendedLoadRange.min.toFixed(0)} -{' '}
                    {metrics.recommendedLoadRange.max.toFixed(0)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
