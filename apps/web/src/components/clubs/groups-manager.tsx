import {
  useAddGroupAthletesMutation,
  useAthleteGroupsQuery,
  useCreateAthleteGroupMutation,
  useDeleteAthleteGroupMutation,
  useRemoveGroupAthleteMutation,
  useRenameAthleteGroupMutation,
  useSetGroupStaffMutation,
} from '@/api/club';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from '@/views/dashboard/settings-view/settings-section';
import { ChevronRight, CornerDownRight, MoreHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ATHLETE_GROUP_NAME_MAX, AthleteGroupDto } from '@openathlete/shared';

import { NameDialog } from './name-dialog';
import { PickPeopleDialog, PickablePerson } from './pick-people-dialog';

type Props = {
  /** A club's groups; null for the coach's own */
  clubId: number | null;
  /** Club coaches and the owner of personal groups edit; assistants read */
  canManage: boolean;
  /** Athletes a group may hold */
  athletes: PickablePerson[];
  /** Assistants a club group can be entrusted to */
  assistants?: PickablePerson[];
  title?: string;
  description?: string;
};

type Dialog =
  | { kind: 'create'; parentId: number | null }
  | { kind: 'rename'; group: AthleteGroupDto }
  | { kind: 'delete'; group: AthleteGroupDto }
  | { kind: 'athletes'; group: AthleteGroupDto }
  | { kind: 'staff'; group: AthleteGroupDto }
  | null;

/**
 * Groups and sub-groups of athletes: a coach's own, or a club's, which its
 * coaches can entrust to assistants.
 */
export function GroupsManager({
  clubId,
  canManage,
  athletes,
  assistants = [],
  title = m.groups_title(),
  description,
}: Props) {
  const { data: groups, isPending } = useAthleteGroupsQuery(clubId);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const close = () => setDialog(null);

  const create = useCreateAthleteGroupMutation();
  const rename = useRenameAthleteGroupMutation();
  const remove = useDeleteAthleteGroupMutation();
  const addAthletes = useAddGroupAthletesMutation();
  const removeAthlete = useRemoveGroupAthleteMutation();
  const setStaff = useSetGroupStaffMutation();
  const failed = () => toast.error(m.groups_save_failed());

  const names = useMemo(
    () => new Map(athletes.map((person) => [person.id, person.name])),
    [athletes],
  );
  const assistantNames = useMemo(
    () => new Map(assistants.map((person) => [person.id, person.name])),
    [assistants],
  );

  const { roots, childrenOf } = useMemo(() => {
    const all = groups ?? [];
    const ids = new Set(all.map((group) => group.athleteGroupId));
    const children = new Map<number, AthleteGroupDto[]>();
    for (const group of all) {
      if (group.parentId === null || !ids.has(group.parentId)) continue;
      children.set(group.parentId, [
        ...(children.get(group.parentId) ?? []),
        group,
      ]);
    }
    // A sub-group whose group is out of sight (an assistant's) stands alone
    const top = all.filter(
      (group) => group.parentId === null || !ids.has(group.parentId),
    );
    return { roots: top, childrenOf: children };
  }, [groups]);

  const toggle = (id: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderGroup = (group: AthleteGroupDto, nested: boolean) => {
    const expanded = open.has(group.athleteGroupId);
    const entrusted = group.staffUserIds
      .map((id) => assistantNames.get(id))
      .filter(Boolean)
      .join(', ');
    return (
      <div key={group.athleteGroupId} data-athlete-group={group.name}>
        <SettingsRow
          className={cn(nested && 'pl-8')}
          leading={nested ? <CornerDownRight className="size-4" /> : undefined}
          title={
            <button
              type="button"
              className="flex min-h-11 items-center gap-1.5 text-left md:min-h-0"
              aria-expanded={expanded}
              onClick={() => toggle(group.athleteGroupId)}
            >
              <ChevronRight
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform',
                  expanded && 'rotate-90',
                )}
              />
              {group.name}
            </button>
          }
          description={
            <>
              {m.groups_athlete_count({ count: group.athleteIds.length })}
              {entrusted && ` · ${m.groups_entrusted_to({ names: entrusted })}`}
            </>
          }
        >
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="max-md:w-11"
                  aria-label={`${m.actions()} ${group.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setDialog({ kind: 'athletes', group })}
                >
                  {m.groups_add_athletes()}
                </DropdownMenuItem>
                {!nested && group.parentId === null && (
                  <DropdownMenuItem
                    onClick={() =>
                      setDialog({
                        kind: 'create',
                        parentId: group.athleteGroupId,
                      })
                    }
                  >
                    {m.groups_new_subgroup()}
                  </DropdownMenuItem>
                )}
                {clubId !== null && (
                  <DropdownMenuItem
                    onClick={() => setDialog({ kind: 'staff', group })}
                  >
                    {m.groups_entrust()}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setDialog({ kind: 'rename', group })}
                >
                  {m.groups_rename()}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDialog({ kind: 'delete', group })}
                >
                  {m.delete_()}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SettingsRow>
        {expanded && (
          <ul className={cn('pb-2', nested ? 'pl-14' : 'pl-10')}>
            {group.athleteIds.length === 0 ? (
              <li className="py-2 pr-4 text-sm text-muted-foreground">
                {m.groups_no_athletes()}
              </li>
            ) : (
              group.athleteIds.map((athleteId) => (
                <li
                  key={athleteId}
                  className="flex min-h-11 items-center justify-between gap-2 pr-2 text-sm"
                >
                  <span className="truncate">
                    {names.get(athleteId) ?? m.groups_unknown_athlete()}
                  </span>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="max-md:w-11"
                      aria-label={m.groups_remove_athlete({
                        name: names.get(athleteId) ?? '',
                      })}
                      onClick={() =>
                        removeAthlete.mutate(
                          { groupId: group.athleteGroupId, athleteId },
                          { onError: failed },
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    );
  };

  return (
    <SettingsSection
      title={title}
      description={description ?? m.groups_description()}
      action={
        canManage ? (
          <Button
            size="sm"
            onClick={() => setDialog({ kind: 'create', parentId: null })}
          >
            {m.groups_new()}
          </Button>
        ) : undefined
      }
    >
      {isPending ? (
        <SettingsRowsSkeleton />
      ) : roots.length === 0 ? (
        <SettingsEmpty>{m.groups_empty()}</SettingsEmpty>
      ) : (
        <div className="space-y-3">
          {roots.map((group) => (
            <SettingsPanel key={group.athleteGroupId}>
              {renderGroup(group, false)}
              {(childrenOf.get(group.athleteGroupId) ?? []).map((child) =>
                renderGroup(child, true),
              )}
            </SettingsPanel>
          ))}
        </div>
      )}

      <NameDialog
        open={dialog?.kind === 'create'}
        onClose={close}
        title={
          dialog?.kind === 'create' && dialog.parentId !== null
            ? m.groups_new_subgroup()
            : m.groups_new()
        }
        label={m.groups_name()}
        submitLabel={m.create()}
        maxLength={ATHLETE_GROUP_NAME_MAX}
        isLoading={create.isPending}
        onSubmit={(name) =>
          dialog?.kind === 'create' &&
          create.mutate(
            { name, clubId, parentId: dialog.parentId },
            {
              onSuccess: (group) => {
                if (dialog.parentId !== null) {
                  setOpen((current) => new Set(current).add(dialog.parentId!));
                }
                setDialog({ kind: 'athletes', group });
              },
              onError: failed,
            },
          )
        }
      />
      <NameDialog
        open={dialog?.kind === 'rename'}
        onClose={close}
        title={m.groups_rename()}
        label={m.groups_name()}
        submitLabel={m.save()}
        maxLength={ATHLETE_GROUP_NAME_MAX}
        defaultValue={dialog?.kind === 'rename' ? dialog.group.name : ''}
        isLoading={rename.isPending}
        onSubmit={(name) =>
          dialog?.kind === 'rename' &&
          rename.mutate(
            { groupId: dialog.group.athleteGroupId, name },
            { onSuccess: close, onError: failed },
          )
        }
      />
      <PickPeopleDialog
        open={dialog?.kind === 'athletes'}
        onClose={close}
        title={m.groups_add_athletes()}
        description={dialog?.kind === 'athletes' ? dialog.group.name : ''}
        people={
          dialog?.kind === 'athletes'
            ? athletes.filter(
                (person) => !dialog.group.athleteIds.includes(person.id),
              )
            : []
        }
        submitLabel={m.groups_add()}
        emptyText={m.groups_everyone_in()}
        isLoading={addAthletes.isPending}
        onSubmit={(athleteIds) =>
          dialog?.kind === 'athletes' &&
          addAthletes.mutate(
            { groupId: dialog.group.athleteGroupId, athleteIds },
            {
              onSuccess: () => {
                setOpen((current) =>
                  new Set(current).add(dialog.group.athleteGroupId),
                );
                close();
              },
              onError: failed,
            },
          )
        }
      />
      <PickPeopleDialog
        open={dialog?.kind === 'staff'}
        onClose={close}
        title={m.groups_entrust()}
        description={m.groups_entrust_description()}
        people={assistants}
        initialIds={dialog?.kind === 'staff' ? dialog.group.staffUserIds : []}
        submitLabel={m.save()}
        emptyText={m.groups_no_assistants()}
        allowEmpty
        isLoading={setStaff.isPending}
        onSubmit={(userIds) =>
          dialog?.kind === 'staff' &&
          setStaff.mutate(
            { groupId: dialog.group.athleteGroupId, userIds },
            { onSuccess: close, onError: failed },
          )
        }
      />
      <ConfirmAction
        open={dialog?.kind === 'delete'}
        onClose={close}
        title={m.groups_delete_title()}
        message={m.groups_delete_message({
          name: dialog?.kind === 'delete' ? dialog.group.name : '',
        })}
        confirmText={m.delete_()}
        isLoading={remove.isPending}
        onConfirm={() =>
          dialog?.kind === 'delete' &&
          remove.mutate(dialog.group.athleteGroupId, {
            onSuccess: close,
            onError: failed,
          })
        }
      />
    </SettingsSection>
  );
}
