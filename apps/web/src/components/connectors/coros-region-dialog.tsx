import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';

import { COROS_REGIONS, CorosRegion } from '@openathlete/shared';

interface CorosRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (region: CorosRegion) => void;
}

const REGION_LABELS: Record<CorosRegion, () => string> = {
  eu: () => m.coros_region_eu(),
  us: () => m.coros_region_us(),
  cn: () => m.coros_region_cn(),
};

/** COROS keeps each account on the server of its region */
export function CorosRegionDialog({
  open,
  onOpenChange,
  onSelect,
}: CorosRegionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.coros_region_title()}</DialogTitle>
          <DialogDescription>{m.coros_region_description()}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {COROS_REGIONS.map((region) => (
            <Button
              key={region}
              variant="outline"
              onClick={() => onSelect(region)}
            >
              {REGION_LABELS[region]()}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
