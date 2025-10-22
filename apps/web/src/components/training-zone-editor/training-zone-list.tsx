import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { useGetMyAthleteQuery } from '@/api/athlete';
import { useDeleteTrainingZone } from '@/api/training-zone';
import { useMemo, useState } from 'react';

import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { TrainingZoneBulkEditor } from './training-zone-bulk-editor';
import { TrainingZoneTable } from './training-zone-table';

interface TrainingZoneListProps {
  athleteId: number;
  type: TRAINING_ZONE_TYPE;
}

export function TrainingZoneList({ athleteId, type }: TrainingZoneListProps) {
  const { data: athlete, isLoading: athleteLoading } = useGetMyAthleteQuery();
  const [editMode, setEditMode] = useState(false);

  const deleteZone = useDeleteTrainingZone();

  const zones = useMemo(() => {
    return (
      athlete?.trainingZones
        .filter((z) => z.type === type)
        .sort((a, b) => a.index - b.index) || []
    );
  }, [athlete, type]);

  if (athleteLoading || !athlete) return <LoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {zones.length === 0
            ? m.no_training_zones_defined()
            : `${zones.length} ${m.training_zones()}`}
        </p>
        <Dialog open={editMode} onOpenChange={setEditMode}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              {zones.length === 0 ? m.create_zones() : m.edit_zones()}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {zones.length === 0 ? m.create_zones() : m.edit_zones()}
              </DialogTitle>
            </DialogHeader>
            <TrainingZoneBulkEditor
              athleteId={athleteId}
              type={type}
              zones={zones}
              onComplete={() => setEditMode(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {zones.length > 0 && (
        <TrainingZoneTable zones={zones} onDelete={deleteZone.mutate} />
      )}
    </div>
  );
}
