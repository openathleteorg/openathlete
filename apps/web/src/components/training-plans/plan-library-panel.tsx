import {
  TrainingPlanAPI,
  useDeleteTrainingPlanTemplateMutation,
  useImportTrainingPlanMutation,
  useTrainingPlanTemplatesQuery,
} from '@/api/training-plan';
import { ConfirmAction } from '@/components/confirm-action/confirm-action';
import { SportIcon } from '@/components/sport-icon/sport-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import {
  CalendarPlus,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { TrainingPlanTemplateSummary } from '@openathlete/shared';

import { ApplyPlanDialog } from './apply-plan-dialog';
import { EditPlanDialog } from './edit-plan-dialog';
import { PlanDetailsDialog } from './plan-details-dialog';
import { planFileName } from './plan-format';
import { planLevelLabel } from './plan-level';
import { SaveFromCalendarDialog } from './save-from-calendar-dialog';

type Plan = TrainingPlanTemplateSummary;

/**
 * The user's library of training plans: plans by week and weekday, to put
 * on a calendar, share as a file or keep for next season.
 */
export function PlanLibraryPanel() {
  const { data: plans = [], isPending } = useTrainingPlanTemplatesQuery();
  const deletePlan = useDeleteTrainingPlanTemplateMutation();
  const importPlan = useImportTrainingPlanMutation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState<Plan | null>(null);
  const [viewing, setViewing] = useState<Plan | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const shown = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return plans;
    return plans.filter((plan) =>
      [plan.name, plan.goal, plan.description].some((text) =>
        text.toLocaleLowerCase().includes(query),
      ),
    );
  }, [plans, search]);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    let content: unknown;
    try {
      content = JSON.parse(await file.text());
    } catch {
      toast.error(m.training_plans_import_invalid());
      return;
    }
    try {
      // The API checks the format: an exported plan, or one of the website
      const plan = await importPlan.mutateAsync({
        file: content as Parameters<typeof importPlan.mutateAsync>[0]['file'],
      });
      toast.success(m.training_plans_imported({ name: plan.name }));
    } catch {
      toast.error(m.training_plans_import_invalid());
    }
  };

  const exportPlan = async (plan: Plan) => {
    try {
      const file = await TrainingPlanAPI.exportTemplate(
        plan.trainingPlanTemplateId,
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(file, null, 2)], {
          type: 'application/json',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = planFileName(plan.name);
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(m.training_plans_failed());
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePlan.mutateAsync(deleting.trainingPlanTemplateId);
      toast.success(m.training_plans_deleted());
    } catch {
      toast.error(m.training_plans_failed());
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {m.training_plans_library_hint()}
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={m.training_plans_search()}
            aria-label={m.training_plans_search()}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => fileInput.current?.click()}
          isLoading={importPlan.isPending}
          aria-label={m.training_plans_import()}
        >
          <Upload className="size-4" />
          <span className="hidden sm:inline">{m.training_plans_import()}</span>
        </Button>
        <Button
          onClick={() => setSaving(true)}
          aria-label={m.training_plans_from_calendar()}
        >
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">
            {m.training_plans_from_calendar()}
          </span>
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-plan-file-input
          onChange={(event) => {
            void importFile(event.target.files?.[0]);
            // The same file can be chosen again
            event.target.value = '';
          }}
        />
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {plans.length === 0
            ? m.training_plans_empty()
            : m.training_plans_no_match()}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((plan) => (
            <li
              key={plan.trainingPlanTemplateId}
              data-plan={plan.trainingPlanTemplateId}
              className="space-y-3 rounded-lg border bg-card p-4"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="flex items-center gap-2 font-medium break-words">
                    {plan.sport && <SportIcon sport={plan.sport} />}
                    {plan.name}
                  </h3>
                  {plan.goal && (
                    <p className="text-sm text-muted-foreground">{plan.goal}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">
                      {m.training_plans_weeks_count({ count: plan.weeks })}
                    </Badge>
                    <Badge variant="secondary">
                      {m.training_plans_sessions_count({
                        count: plan.sessions,
                      })}
                    </Badge>
                    {plan.level && (
                      <Badge variant="outline">
                        {planLevelLabel(plan.level)}
                      </Badge>
                    )}
                    {plan.activeApplications > 0 && (
                      <Badge>
                        {m.training_plans_active_count({
                          count: plan.activeApplications,
                        })}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 md:size-9"
                      aria-label={m.ui_more()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(plan)}>
                      <Pencil className="size-4" />
                      {m.edit()}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void exportPlan(plan)}>
                      <Download className="size-4" />
                      {m.training_plans_export()}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(plan)}
                    >
                      <Trash2 className="size-4" />
                      {m.delete_()}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setApplying(plan)}>
                  {m.training_plans_apply()}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewing(plan)}
                >
                  <Eye className="size-4" />
                  {m.training_plans_details()}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ApplyPlanDialog plan={applying} onClose={() => setApplying(null)} />
      <PlanDetailsDialog plan={viewing} onClose={() => setViewing(null)} />
      <EditPlanDialog plan={editing} onClose={() => setEditing(null)} />
      <SaveFromCalendarDialog open={saving} onClose={() => setSaving(false)} />
      <ConfirmAction
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title={m.training_plans_delete_title()}
        message={m.training_plans_delete_message()}
        confirmText={m.delete_()}
        isLoading={deletePlan.isPending}
      />
    </div>
  );
}
