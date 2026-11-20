import {
  useArchiveQuestionnaireMutation,
  useDeleteQuestionnaireMutation,
  useQuestionnairesQuery,
  useRestoreQuestionnaireMutation,
} from '@/api/questionnaire';
import { ConfirmAction } from '@/components/confirm-action';
import { formatShortDay } from '@/components/questionnaires/answer-format';
import { questionnaireErrorMessage } from '@/components/questionnaires/questionnaire-errors';
import { TemplateGallery } from '@/components/questionnaires/template-gallery';
import { useFeaturePaywall } from '@/components/supporter-perks/feature-paywall';
import { SupporterMark } from '@/components/supporter-perks/locks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageTitle } from '@/components/ui/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeature } from '@/hooks/use-feature';
import { useSetPageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import {
  questionnaireAnswersPath,
  questionnaireEditPath,
} from '@/routes/paths';
import {
  Archive,
  BarChart3,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Feature, type QuestionnaireSummary } from '@openathlete/shared';

type Pending = {
  kind: 'archive' | 'delete';
  questionnaire: QuestionnaireSummary;
} | null;

/**
 * The coach's questionnaires: write them, place them in calendars from a
 * day's menu, and follow the answers.
 */
export function QuestionnaireLibraryView() {
  const [archived, setArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const { data: questionnaires, isLoading } = useQuestionnairesQuery({
    archived,
  });
  const archive = useArchiveQuestionnaireMutation();
  const restore = useRestoreQuestionnaireMutation();
  const remove = useDeleteQuestionnaireMutation();
  // One active questionnaire is free; a second is a coach tool. Those
  // already active keep being sent
  const tool = useFeature(Feature.COACH_QUESTIONNAIRES);
  const paywall = useFeaturePaywall();
  const { data: active } = useQuestionnairesQuery({ archived: false });
  const mayActivate = tool.available || (active?.length ?? 0) < 1;
  const activateOr = (go: () => void) => () =>
    mayActivate
      ? go()
      : paywall.open(Feature.COACH_QUESTIONNAIRES, 'questionnaires');

  // The mobile top bar holds the creation, as the page's only action
  const actions = useMemo(
    () => [
      {
        label: m.questionnaire_create(),
        icon: Plus,
        onClick: activateOr(() => setCreating(true)),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mayActivate],
  );
  useSetPageActions(actions);

  const confirm = () => {
    if (!pending) return;
    const { kind, questionnaire } = pending;
    const onError = (error: unknown) =>
      toast.error(
        questionnaireErrorMessage(error) ?? m.questionnaire_action_failed(),
      );
    if (kind === 'archive') {
      archive.mutate(questionnaire.questionnaireId, {
        onSuccess: ({ removedOccurrences }) => {
          toast.success(
            m.questionnaire_archived({ count: removedOccurrences }),
          );
          setPending(null);
        },
        onError,
      });
    } else {
      remove.mutate(questionnaire.questionnaireId, {
        onSuccess: () => {
          toast.success(m.questionnaire_deleted());
          setPending(null);
        },
        onError,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle desktopOnly>{m.questionnaires()}</PageTitle>
        <Button
          className="hidden md:inline-flex"
          onClick={activateOr(() => setCreating(true))}
        >
          <Plus />
          {m.questionnaire_create()}
          {!mayActivate && tool.locked && (
            <SupporterMark className="text-primary-foreground/80" />
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {m.questionnaire_library_intro()}
      </p>

      <Tabs
        value={archived ? 'archived' : 'active'}
        onValueChange={(value) => setArchived(value === 'archived')}
      >
        <TabsList>
          <TabsTrigger value="active">{m.questionnaire_active()}</TabsTrigger>
          <TabsTrigger value="archived">
            {m.questionnaire_archived_tab()}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {!isLoading &&
        questionnaires?.length === 0 &&
        (archived ? (
          <p className="text-sm text-muted-foreground">
            {m.questionnaire_none_archived()}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {m.questionnaire_start_from()}
            </p>
            <TemplateGallery />
          </div>
        ))}

      <ul className="space-y-3">
        {questionnaires?.map((questionnaire) => (
          <li
            key={questionnaire.questionnaireId}
            className="flex flex-wrap items-center gap-3 rounded-lg border p-4"
            data-questionnaire={questionnaire.questionnaireId}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-medium">{questionnaire.title}</p>
              <p className="text-xs text-muted-foreground">
                {[
                  m.questionnaire_question_count({
                    count: questionnaire.questionCount,
                  }),
                  m.questionnaire_placed_count({
                    count: questionnaire.placedCount,
                  }),
                  m.questionnaire_answered_count({
                    count: questionnaire.answeredCount,
                  }),
                  questionnaire.lastAnsweredAt &&
                    m.questionnaire_last_answer({
                      date: formatShortDay(questionnaire.lastAnsweredAt),
                    }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="outline" size="sm">
                <Link
                  to={questionnaireAnswersPath(questionnaire.questionnaireId)}
                >
                  <BarChart3 />
                  {m.questionnaire_answers()}
                </Link>
              </Button>
              {!archived && (
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to={questionnaireEditPath(questionnaire.questionnaireId)}
                  >
                    <Pencil />
                    <span className="sr-only md:not-sr-only">{m.edit()}</span>
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={m.questionnaire_more_actions({
                      title: questionnaire.title,
                    })}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {archived ? (
                    <DropdownMenuItem
                      onSelect={activateOr(() =>
                        restore.mutate(questionnaire.questionnaireId, {
                          onSuccess: () =>
                            toast.success(m.questionnaire_restored()),
                          onError: () =>
                            toast.error(m.questionnaire_action_failed()),
                        }),
                      )}
                    >
                      <Undo2 className="size-4" />
                      {m.questionnaire_restore()}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={() =>
                        setPending({ kind: 'archive', questionnaire })
                      }
                    >
                      <Archive className="size-4" />
                      {m.questionnaire_archive()}
                    </DropdownMenuItem>
                  )}
                  {questionnaire.answeredCount === 0 && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() =>
                        setPending({ kind: 'delete', questionnaire })
                      }
                    >
                      <Trash2 className="size-4" />
                      {m.questionnaire_delete()}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-2xl" mobileFullscreen>
          <DialogHeader>
            <DialogTitle>{m.questionnaire_create()}</DialogTitle>
            <DialogDescription>
              {m.questionnaire_start_from()}
            </DialogDescription>
          </DialogHeader>
          <TemplateGallery />
        </DialogContent>
      </Dialog>

      <ConfirmAction
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        isLoading={archive.isPending || remove.isPending}
        title={
          pending?.kind === 'delete'
            ? m.questionnaire_delete_title()
            : m.questionnaire_archive_title()
        }
        message={
          pending?.kind === 'delete'
            ? m.questionnaire_delete_message({
                title: pending.questionnaire.title,
              })
            : m.questionnaire_archive_message({
                title: pending?.questionnaire.title ?? '',
              })
        }
        confirmText={
          pending?.kind === 'delete'
            ? m.questionnaire_delete()
            : m.questionnaire_archive()
        }
      />
    </div>
  );
}
