import { useGetMyEquipmentQuery } from '@/api/equipment';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  equipmentId: number;
}

export function EquipmentStat({ equipmentId }: P) {
  const units = useUnits();
  const { data: equipment = [] } = useGetMyEquipmentQuery();
  const equipmentItem = equipment.find((e) => e.equipmentId === equipmentId);

  if (!equipmentItem) return null;

  return (
    <Popover>
      <PopoverTrigger className="text-left">
        <div className="text-sm font-semibold">{m.equipment()}</div>
        <div>{equipmentItem.name}</div>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <div>
            {m.total_distance()}:{' '}
            <span className="text-muted-foreground text-sm">
              {units.distanceValue(equipmentItem.totalDistance).toFixed(1)}{' '}
              {units.distanceLabel}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
