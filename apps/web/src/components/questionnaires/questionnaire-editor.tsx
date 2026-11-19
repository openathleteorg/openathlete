import {
  useCreateQuestionnaireMutation,
  useUpdateQuestionnaireMutation,
} from '@/api/questionnaire';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  type Resolver,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';

import {
  type AnswerInput,
  QUESTIONNAIRE_MAX_QUESTIONS,
  QUESTIONNAIRE_SCORE,
  type Question,
  type Questionnaire,
  type QuestionnaireInput,
  type QuestionnaireInputDraft,
  questionInputSchema,
  questionnaireInputSchema,
} from '@openathlete/shared';

import { emptyAnswer } from './answer-format';
import { editorErrorMessage } from './editor-errors';
import { QuestionEditor } from './question-editor';
import { QuestionField } from './question-field';
import {
  QUESTION_TYPES,
  newQuestion,
  questionTypeIcon,
  questionTypeLabel,
} from './question-types';
import { questionnaireErrorMessage } from './questionnaire-errors';

const NO_METRIC = 'none';

interface P {
  /** The questionnaire edited; absent, a new one from `initial` */
  questionnaire?: Questionnaire;
  initial: QuestionnaireInputDraft;
  /** Athletes answered it: changing a question's meaning replaces it */
  hasAnswers?: boolean;
  onSaved: (questionnaire: Questionnaire) => void;
  onCancel: () => void;
}

export function QuestionnaireEditor({
  questionnaire,
  initial,
  hasAnswers = false,
  onSaved,
  onCancel,
}: P) {
  const methods = useForm<QuestionnaireInputDraft, unknown, QuestionnaireInput>(
    {
      // The schema fills defaults: the form holds its input, saves its output
      resolver: zodResolver(questionnaireInputSchema) as unknown as Resolver<
        QuestionnaireInputDraft,
        unknown,
        QuestionnaireInput
      >,
      defaultValues: initial,
    },
  );
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });
  const scoreKind = useWatch({ control, name: 'scoreKind' });
  const [preview, setPreview] = useState(false);
  const create = useCreateQuestionnaireMutation();
  const update = useUpdateQuestionnaireMutation();

  const onSubmit = handleSubmit(
    async (values) => {
      // Questions left out of the score once the score is off
      const body: QuestionnaireInput =
        values.scoreKind === QUESTIONNAIRE_SCORE.NONE
          ? {
              ...values,
              scoreMetricType: null,
              questions: values.questions.map((question) => ({
                ...question,
                inScore: false,
              })),
            }
          : values;
      try {
        const saved = questionnaire
          ? await update.mutateAsync({
              questionnaireId: questionnaire.questionnaireId,
              body,
            })
          : await create.mutateAsync(body);
        toast.success(m.questionnaire_saved());
        onSaved(saved);
      } catch (error) {
        toast.error(
          questionnaireErrorMessage(error) ?? m.questionnaire_save_failed(),
        );
      }
    },
    () => toast.error(m.questionnaire_fix_errors()),
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={preview ? 'outline' : 'secondary'}
            size="sm"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            <Pencil />
            {m.questionnaire_edit_mode()}
          </Button>
          <Button
            type="button"
            variant={preview ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            <Eye />
            {m.questionnaire_preview()}
          </Button>
        </div>

        {preview ? (
          <QuestionnairePreview />
        ) : (
          <>
            {hasAnswers && (
              <p className="rounded-lg bg-muted px-4 py-3 text-sm">
                {m.questionnaire_answered_warning()}
              </p>
            )}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="questionnaire-title">
                  {m.questionnaire_title()}
                </Label>
                <Input
                  id="questionnaire-title"
                  {...register('title')}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && (
                  <p role="alert" className="text-xs text-destructive">
                    {editorErrorMessage(errors.title.message)}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="questionnaire-description">
                  {m.questionnaire_description()}
                </Label>
                <Textarea
                  id="questionnaire-description"
                  rows={3}
                  placeholder={m.questionnaire_description_placeholder()}
                  {...register('description')}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="questionnaire-score">
                  {m.questionnaire_score_kind()}
                </Label>
                <Controller
                  control={control}
                  name="scoreKind"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? QUESTIONNAIRE_SCORE.NONE}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="questionnaire-score"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={QUESTIONNAIRE_SCORE.NONE}>
                          {m.questionnaire_score_none()}
                        </SelectItem>
                        <SelectItem value={QUESTIONNAIRE_SCORE.SUM}>
                          {m.questionnaire_score_sum()}
                        </SelectItem>
                        <SelectItem value={QUESTIONNAIRE_SCORE.AVERAGE}>
                          {m.questionnaire_score_average()}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {m.questionnaire_score_hint()}
                </p>
                {errors.scoreKind && (
                  <p role="alert" className="text-xs text-destructive">
                    {editorErrorMessage(errors.scoreKind.message)}
                  </p>
                )}
              </div>
              {scoreKind && scoreKind !== QUESTIONNAIRE_SCORE.NONE && (
                <div className="grid gap-2">
                  <Label htmlFor="questionnaire-score-metric">
                    {m.questionnaire_score_metric()}
                  </Label>
                  <Controller
                    control={control}
                    name="scoreMetricType"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? NO_METRIC}
                        onValueChange={(value) =>
                          field.onChange(value === NO_METRIC ? null : value)
                        }
                      >
                        <SelectTrigger
                          id="questionnaire-score-metric"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_METRIC}>
                            {m.question_no_metric()}
                          </SelectItem>
                          {/* The Hooper index is the score metric there is */}
                          <SelectItem value="HOOPER_INDEX">
                            {metricTypeLabelMap.HOOPER_INDEX}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <QuestionEditor
                  key={field.id}
                  index={index}
                  count={fields.length}
                  onMove={(to) => move(index, to)}
                  onRemove={() => remove(index)}
                />
              ))}
              {errors.questions?.root?.message || errors.questions?.message ? (
                <p role="alert" className="text-xs text-destructive">
                  {editorErrorMessage(
                    errors.questions?.root?.message ??
                      errors.questions?.message,
                  )}
                </p>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={fields.length >= QUESTIONNAIRE_MAX_QUESTIONS}
                  >
                    <Plus />
                    {m.question_add()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {QUESTION_TYPES.map((type) => {
                    const Icon = questionTypeIcon[type];
                    return (
                      <DropdownMenuItem
                        key={type}
                        onSelect={() => append(newQuestion(type))}
                      >
                        <Icon className="size-4" />
                        {questionTypeLabel(type)}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {m.cancel()}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {m.questionnaire_save()}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/** The questionnaire as the athlete will see it, to try */
function QuestionnairePreview() {
  const draft = useWatch<QuestionnaireInputDraft>();
  const questions = useMemo<Question[]>(
    () =>
      (draft.questions ?? []).flatMap((question, index) => {
        // A question still being written shows once it reads as one
        const parsed = questionInputSchema.safeParse(question);
        if (!parsed.success) return [];
        return [
          {
            ...parsed.data,
            questionId: -(index + 1),
            position: index,
            archivedAt: null,
          } as Question,
        ];
      }),
    [draft.questions],
  );
  const [values, setValues] = useState<Record<number, AnswerInput>>({});

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-lg font-semibold">
          {draft.title || m.questionnaire_untitled()}
        </p>
        {draft.description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {draft.description}
          </p>
        )}
      </div>
      {questions.map((question) => (
        <QuestionField
          key={question.questionId}
          question={question}
          value={
            values[question.questionId] ?? emptyAnswer(question.questionId)
          }
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              [question.questionId]: value,
            }))
          }
        />
      ))}
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {m.questionnaire_preview_empty()}
        </p>
      )}
    </div>
  );
}
