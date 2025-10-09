import { m } from '@/paraglide/messages';
import { trainingZoneTypeLabelMap } from '@/utils/label-map/core';
import { useState } from 'react';

import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrainingZoneList } from './training-zone-list';

interface TrainingZoneEditorProps {
  athleteId: number;
}

export function TrainingZoneEditor({ athleteId }: TrainingZoneEditorProps) {
  const [selectedType, setSelectedType] = useState<TRAINING_ZONE_TYPE>(
    TRAINING_ZONE_TYPE.HEARTRATE,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{m.training_zones()}</h2>
      </div>

      <Tabs
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as TRAINING_ZONE_TYPE)}
      >
        <TabsList className="grid w-full grid-cols-3">
          {Object.values(TRAINING_ZONE_TYPE).map((type) => (
            <TabsTrigger key={type} value={type}>
              {trainingZoneTypeLabelMap[type]}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.values(TRAINING_ZONE_TYPE).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <TrainingZoneList athleteId={athleteId} type={type} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
