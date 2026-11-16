import {
  useDeleteThresholdMutation,
  useMetricThresholdsQuery,
  useSetThresholdsMutation,
} from '@/api/coach';
import { AthletePicker } from '@/components/clubs/athlete-picker';
import { useCoachedAthletes } from '@/components/clubs/use-coached-athletes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getMetricUnit } from '@/utils/metric-unit';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DASHBOARD_METRIC_TYPES, METRIC_TYPE } from '@openathlete/shared';

/** Sleep is stored in hours; the coach types hours too */
const parse = (value: string) => {
  const number = Number(value.replace(',', '.'));
  return value.trim() === '' || Number.isNaN(number) ? null : number;
};

/**
 * Bounds on athletes' daily metrics: a value past them is flagged on the
 * dashboard and notifies the coach. Set on several athletes, or a group,
 * at once.
 */
export function ThresholdsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const athletes = useCoachedAthletes();
  const { data: thresholds } = useMetricThresholdsQuery({ enabled: open });
  const setThresholds = useSetThresholdsMutation();
  const deleteThreshold = useDeleteThresholdMutation();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [metricType, setMetricType] = useState<string>('HR_REST');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setMin('');
    setMax('');
  }, [open]);

  const names = useMemo(
    () => new Map(athletes.map((athlete) => [athlete.athleteId, athlete.name])),
    [athletes],
  );
  const low = parse(min);
  const high = parse(max);
  const invalid =
    selected.size === 0 ||
    (low === null && high === null) ||
    (low !== null && high !== null && low >= high);
  const label = (type: string) =>
    metricTypeLabelMap[type as METRIC_TYPE] ?? type;
  const unit = getMetricUnit(metricType as METRIC_TYPE);

  const save = () =>
    setThresholds.mutate(
      { athleteIds: [...selected], metricType, min: low, max: high },
      {
        onSuccess: () => {
          setSelected(new Set());
          setMin('');
          setMax('');
          toast.success(m.coach_thresholds_saved());
        },
        onError: () => toast.error(m.coach_thresholds_failed()),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        mobileFullscreen
        data-thresholds-dialog
      >
        <DialogHeader>
          <DialogTitle>{m.coach_thresholds_title()}</DialogTitle>
          <DialogDescription>
            {m.coach_thresholds_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {!!thresholds?.length && (
            <ul className="divide-y rounded-xl border" data-thresholds-list>
              {thresholds.map((threshold) => (
                <li
                  key={threshold.metricThresholdId}
                  className="flex min-h-11 items-center justify-between gap-2 px-3 py-1.5 text-sm"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">
                      {names.get(threshold.athleteId) ?? '–'}
                    </span>
                    {' · '}
                    {label(threshold.metricType)}{' '}
                    <span className="text-muted-foreground tabular-nums">
                      {threshold.min ?? '–'} ↔ {threshold.max ?? '–'}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="max-md:w-11"
                    aria-label={m.delete_()}
                    disabled={deleteThreshold.isPending}
                    onClick={() =>
                      deleteThreshold.mutate(threshold.metricThresholdId)
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3 rounded-xl border p-3">
            <p className="text-sm font-medium">{m.coach_thresholds_add()}</p>
            <div className="grid gap-2">
              <Label>{m.coach_thresholds_metric()}</Label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger aria-label={m.coach_thresholds_metric()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_METRIC_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {label(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="threshold-min">
                  {m.coach_thresholds_min()} {unit && `(${unit})`}
                </Label>
                <Input
                  id="threshold-min"
                  inputMode="decimal"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="threshold-max">
                  {m.coach_thresholds_max()} {unit && `(${unit})`}
                </Label>
                <Input
                  id="threshold-max"
                  inputMode="decimal"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                />
              </div>
            </div>
            <AthletePicker
              athletes={athletes}
              selected={selected}
              onChange={setSelected}
            />
            <div className="flex justify-end">
              <Button
                onClick={save}
                disabled={invalid || setThresholds.isPending}
                isLoading={setThresholds.isPending}
              >
                {m.coach_thresholds_save({ count: selected.size })}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
