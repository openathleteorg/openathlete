import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import {
  EventAPI,
  usePlanForAthletesMutation,
  usePlanForAthletesPreviewMutation,
} from '@/api/event';
import { undoable } from '@/components/calendar/utils/undo';
import { useGroupFilterOptions } from '@/components/clubs/use-group-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { cn } from '@/utils/shadcn';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  METRIC_TYPE,
  PlanForAthletesDto,
  PlanForAthletesPreviewDto,
  PlanForAthletesSource,
} from '@openathlete/shared';

type Props = {
  open: boolean;
  onClose: () => void;
  source: PlanForAthletesSource;
  /** What is planned, for the title: a session or a week */
  label: string;
  /** The local day the first session lands on, by default */
  defaultDate: string;
  /** A template's start time; sessions copied from a calendar keep theirs */
  defaultTime?: string;
  /** The athlete whose calendar the sessions come from: not a target */
  sourceAthleteId?: number | null;
};

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** What each warning says, for one athlete of the preview */
function warningsOf(row: PlanForAthletesPreviewDto['athletes'][number]) {
  const warnings: string[] = [];
  for (const metric of row.missingMetrics) {
    warnings.push(
      m.plan_for_athletes_missing_metric({
        metric: metricTypeLabelMap[metric as METRIC_TYPE] ?? metric,
      }),
    );
  }
  if (row.missingZones) warnings.push(m.plan_for_athletes_missing_zones());
  if (row.sameDayEvents > 0) {
    warnings.push(m.plan_for_athletes_same_day({ count: row.sameDayEvents }));
  }
  for (const kind of row.unavailable) {
    warnings.push(
      kind === 'ILLNESS'
        ? m.plan_for_athletes_ill()
        : kind === 'INJURY'
          ? m.plan_for_athletes_injured()
          : m.plan_for_athletes_travelling(),
    );
  }
  return warnings;
}

/**
 * Plans a template, or sessions of one calendar, for several athletes at
 * once: pick athletes or groups and a day, read the warnings, then plan.
 * The toast undoes the whole operation.
 */
export function PlanForAthletesDialog({
  open,
  onClose,
  source,
  label,
  defaultDate,
  defaultTime,
  sourceAthleteId,
}: Props) {
  const queryClient = useQueryClient();
  const { data: coached } = useGetMyCoachedAthletesQuery();
  const groups = useGroupFilterOptions();
  const previewMutation = usePlanForAthletesPreviewMutation();
  const planMutation = usePlanForAthletesMutation();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime ?? '');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<PlanForAthletesPreviewDto | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setDate(defaultDate);
    setTime(defaultTime ?? '');
    setSearch('');
    setPreview(null);
  }, [open, defaultDate, defaultTime]);

  const athletes = useMemo(
    () =>
      (coached ?? [])
        .filter((athlete) => athlete.athleteId !== sourceAthleteId)
        .map((athlete) => ({
          id: athlete.athleteId,
          name: `${athlete.user?.firstName ?? ''} ${athlete.user?.lastName ?? ''}`.trim(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [coached, sourceAthleteId],
  );
  const eligible = useMemo(
    () => new Set(athletes.map((athlete) => athlete.id)),
    [athletes],
  );
  const shown = search.trim()
    ? athletes.filter((athlete) =>
        athlete.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      )
    : athletes;

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const addGroup = (ids: Set<number>) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) if (eligible.has(id)) next.add(id);
      return next;
    });

  const dto = (): PlanForAthletesDto => ({
    source,
    athleteIds: [...selected],
    date,
    ...(time && { time }),
    timeZone: timeZone(),
  });

  const review = () =>
    previewMutation.mutate(dto(), {
      onSuccess: setPreview,
      onError: () => toast.error(m.plan_for_athletes_failed()),
    });

  const plan = () =>
    planMutation.mutate(dto(), {
      onSuccess: ({ batchId }) => {
        onClose();
        undoable(
          m.plan_for_athletes_done({ count: selected.size }),
          async () => {
            await EventAPI.undoBatch(batchId);
            await queryClient.invalidateQueries();
          },
        );
      },
      onError: () => toast.error(m.plan_for_athletes_failed()),
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg" data-plan-for-athletes>
        <DialogHeader>
          <DialogTitle>{m.plan_for_athletes_title()}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="flex min-h-0 flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {m.plan_for_athletes_preview_summary({
                sessions: preview.eventCount,
                athletes: preview.athletes.length,
              })}
            </p>
            <ul
              className="max-h-80 divide-y overflow-y-auto rounded-xl border"
              data-plan-preview
            >
              {preview.athletes.map((row) => {
                const warnings = warningsOf(row);
                return (
                  <li key={row.athleteId} className="space-y-1 px-3 py-2.5">
                    <p className="text-sm font-medium">
                      {row.firstName} {row.lastName}
                    </p>
                    {warnings.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {m.plan_for_athletes_ready()}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {warnings.map((warning) => (
                          <Badge
                            key={warning}
                            variant="outline"
                            className="whitespace-normal text-left"
                            data-plan-warning
                          >
                            {warning}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPreview(null)}
                disabled={planMutation.isPending}
              >
                {m.plan_for_athletes_back()}
              </Button>
              <Button
                onClick={plan}
                isLoading={planMutation.isPending}
                disabled={planMutation.isPending}
              >
                {m.plan_for_athletes_confirm({ count: selected.size })}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="plan-for-athletes-date">
                  {m.plan_for_athletes_date()}
                </Label>
                <Input
                  id="plan-for-athletes-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-for-athletes-time">
                  {m.plan_for_athletes_time()}
                </Label>
                <Input
                  id="plan-for-athletes-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              {source.kind === 'events'
                ? m.plan_for_athletes_dates_hint()
                : m.plan_for_athletes_time_hint()}
            </p>

            {groups.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {m.plan_for_athletes_groups()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <Button
                      key={group.value}
                      variant="outline"
                      size="sm"
                      onClick={() => addGroup(group.athleteIds)}
                    >
                      + {group.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex min-h-0 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {m.plan_for_athletes_athletes({ count: selected.size })}
                </p>
                {selected.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(new Set())}
                  >
                    {m.plan_for_athletes_clear()}
                  </Button>
                )}
              </div>
              {athletes.length > 8 && (
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={m.club_search_people()}
                  aria-label={m.club_search_people()}
                />
              )}
              {athletes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {m.plan_for_athletes_no_athletes()}
                </p>
              ) : (
                <ul className="max-h-64 divide-y overflow-y-auto rounded-xl border">
                  {shown.map((athlete) => (
                    <li key={athlete.id}>
                      <label
                        className={cn(
                          'flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm',
                        )}
                      >
                        <Checkbox
                          checked={selected.has(athlete.id)}
                          onCheckedChange={() => toggle(athlete.id)}
                        />
                        <span className="truncate">{athlete.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                {m.cancel()}
              </Button>
              <Button
                onClick={review}
                isLoading={previewMutation.isPending}
                disabled={
                  previewMutation.isPending || selected.size === 0 || !date
                }
              >
                {m.plan_for_athletes_review()}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
