import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrainingLoadCalculationType } from '@/api/training-load';
import { ActivityIcon } from 'lucide-react';

interface TrainingLoadBadgeProps {
  value: number;
  calculationType: TrainingLoadCalculationType;
  showLabel?: boolean;
}

const CALCULATION_TYPE_LABELS: Record<TrainingLoadCalculationType, string> = {
  [TrainingLoadCalculationType.FOSTER_RPE]: 'Foster',
  [TrainingLoadCalculationType.TRIMP_EDWARDS]: 'TRIMP E',
  [TrainingLoadCalculationType.TRIMP_BANISTER]: 'TRIMP B',
};

export function TrainingLoadBadge({
  value,
  calculationType,
  showLabel = true,
}: TrainingLoadBadgeProps) {
  const label = CALCULATION_TYPE_LABELS[calculationType];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1.5">
            <ActivityIcon className="h-3 w-3" />
            {showLabel && <span className="text-xs">{label}:</span>}
            <span className="font-medium">{value.toFixed(0)}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Charge d'entraînement ({label}): {value.toFixed(1)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
