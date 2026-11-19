import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { getMetricUnit } from '@/utils/metric-unit';
import { cn } from '@/utils/shadcn';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { useId } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import {
  METRIC_QUESTION_TYPES,
  QUESTIONNAIRE_METRIC_TYPES,
  QUESTIONNAIRE_SCORE,
  QUESTION_MAX_OPTIONS,
  QUESTION_TYPE,
  type QuestionnaireInputDraft,
  SCORE_QUESTION_TYPES,
} from '@openathlete/shared';

import { editorErrorMessage } from './editor-errors';
import {
  SCALE_PRESETS,
  newOptionId,
  questionTypeIcon,
  questionTypeLabel,
} from './question-types';

const NO_METRIC = 'none';

type Path = `questions.${number}`;

/** A labelled field with its error underneath */
function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** A number input whose empty value is null, not 0 or '' */
function NumberInput({
  name,
  id,
  nullable = false,
  ...props
}: {
  name: string;
  id: string;
  nullable?: boolean;
} & Omit<React.ComponentProps<'input'>, 'name' | 'id'>) {
  const { control } = useFormContext<QuestionnaireInputDraft>();
  return (
    <Controller
      control={control}
      name={name as `questions.${number}.config`}
      render={({ field, fieldState }) => (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          aria-invalid={Boolean(fieldState.error)}
          value={
            field.value === null || field.value === undefined
              ? ''
              : String(field.value)
          }
          onChange={(event) => {
            const raw = event.target.value;
            field.onChange(
              raw === '' ? (nullable ? null : undefined) : Number(raw),
            );
          }}
          onBlur={field.onBlur}
          {...props}
        />
      )}
    />
  );
}

interface P {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}

/** One question of the editor, with the settings of its type */
export function QuestionEditor({ index, count, onMove, onRemove }: P) {
  const id = useId();
  const path: Path = `questions.${index}`;
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<QuestionnaireInputDraft>();
  const question = useWatch({ control, name: path });
  const scoreKind = useWatch({ control, name: 'scoreKind' });
  const questionErrors = errors.questions?.[index];
  const configErrors = questionErrors?.config as
    Record<string, { message?: string } | undefined> | undefined;
  const Icon = questionTypeIcon[question.type];
  const canScore = (SCORE_QUESTION_TYPES as readonly QUESTION_TYPE[]).includes(
    question.type,
  );
  const canFillMetric = (
    METRIC_QUESTION_TYPES as readonly QUESTION_TYPE[]
  ).includes(question.type);

  return (
    <section
      className="space-y-4 rounded-lg border p-4"
      aria-label={m.question_number({ number: index + 1 })}
      data-question-editor={index}
    >
      <header className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium">
          {index + 1}. {questionTypeLabel(question.type)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
            aria-label={m.question_move_up()}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === count - 1}
            onClick={() => onMove(index + 1)}
            aria-label={m.question_move_down()}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={count === 1}
            onClick={onRemove}
            aria-label={m.question_remove()}
          >
            <Trash2 />
          </Button>
        </div>
      </header>

      <Field
        label={m.question_label()}
        htmlFor={`${id}-label`}
        error={editorErrorMessage(questionErrors?.label?.message)}
      >
        <Input
          id={`${id}-label`}
          {...register(`${path}.label`)}
          aria-invalid={Boolean(questionErrors?.label)}
        />
      </Field>
      <Field
        label={m.question_help()}
        htmlFor={`${id}-help`}
        error={editorErrorMessage(questionErrors?.help?.message)}
      >
        <Input
          id={`${id}-help`}
          placeholder={m.question_help_placeholder()}
          {...register(`${path}.help`)}
        />
      </Field>

      {question.type === QUESTION_TYPE.SCALE && (
        <ScaleSettings path={path} id={id} errors={configErrors} />
      )}
      {question.type === QUESTION_TYPE.NUMBER && (
        <NumberSettings path={path} id={id} errors={configErrors} />
      )}
      {(question.type === QUESTION_TYPE.SINGLE_CHOICE ||
        question.type === QUESTION_TYPE.MULTIPLE_CHOICE) && (
        <ChoiceSettings path={path} id={id} />
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Controller
          control={control}
          name={`${path}.required`}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Switch
                id={`${id}-required`}
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor={`${id}-required`}>{m.question_required()}</Label>
            </div>
          )}
        />
        {canScore && scoreKind !== QUESTIONNAIRE_SCORE.NONE && (
          <Controller
            control={control}
            name={`${path}.inScore`}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-score`}
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <Label htmlFor={`${id}-score`}>{m.question_in_score()}</Label>
              </div>
            )}
          />
        )}
      </div>

      {canFillMetric && (
        <Field
          label={m.question_metric()}
          htmlFor={`${id}-metric`}
          error={editorErrorMessage(questionErrors?.metricType?.message)}
        >
          <Controller
            control={control}
            name={`${path}.metricType`}
            render={({ field }) => (
              <Select
                value={field.value ?? NO_METRIC}
                onValueChange={(value) => {
                  const metric =
                    value === NO_METRIC
                      ? null
                      : (value as (typeof QUESTIONNAIRE_METRIC_TYPES)[number]);
                  field.onChange(metric);
                  // The answer is stored in the metric's unit: ask in it
                  if (metric && question.type === QUESTION_TYPE.NUMBER) {
                    setValue(
                      `${path}.config.unit` as never,
                      getMetricUnit(metric) as never,
                    );
                  }
                }}
              >
                <SelectTrigger id={`${id}-metric`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_METRIC}>
                    {m.question_no_metric()}
                  </SelectItem>
                  {QUESTIONNAIRE_METRIC_TYPES.map((metric) => (
                    <SelectItem key={metric} value={metric}>
                      {metricTypeLabelMap[metric]} ({getMetricUnit(metric)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            {m.question_metric_hint()}
          </p>
        </Field>
      )}
    </section>
  );
}

function ScaleSettings({
  path,
  id,
  errors,
}: {
  path: Path;
  id: string;
  errors?: Record<string, { message?: string } | undefined>;
}) {
  const { control, register, setValue } =
    useFormContext<QuestionnaireInputDraft>();
  const config = useWatch({ control, name: `${path}.config` }) as {
    min?: number;
    max?: number;
  };
  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={m.question_scale_presets()}
      >
        {SCALE_PRESETS.map((preset) => {
          const active = config.min === preset.min && config.max === preset.max;
          return (
            <Button
              key={`${preset.min}-${preset.max}`}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              aria-pressed={active}
              onClick={() => {
                setValue(`${path}.config.min` as never, preset.min as never, {
                  shouldDirty: true,
                });
                setValue(`${path}.config.max` as never, preset.max as never, {
                  shouldDirty: true,
                });
                // Long scales read better as a slider
                setValue(
                  `${path}.config.display` as never,
                  (preset.max - preset.min >= 11
                    ? 'SLIDER'
                    : 'BUTTONS') as never,
                );
              }}
            >
              {preset.min}–{preset.max}
            </Button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Field label={m.question_scale_min()} htmlFor={`${id}-min`}>
          <NumberInput name={`${path}.config.min`} id={`${id}-min`} step={1} />
        </Field>
        <Field
          label={m.question_scale_max()}
          htmlFor={`${id}-max`}
          error={editorErrorMessage(errors?.max?.message)}
        >
          <NumberInput name={`${path}.config.max`} id={`${id}-max`} step={1} />
        </Field>
        <Field label={m.question_scale_step()} htmlFor={`${id}-step`}>
          <Controller
            control={control}
            name={`${path}.config.step` as `questions.${number}.config`}
            render={({ field }) => (
              <Select
                value={String(field.value ?? 1)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger id={`${id}-step`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="0.5">0.5</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label={m.question_scale_display()} htmlFor={`${id}-display`}>
          <Controller
            control={control}
            name={`${path}.config.display` as `questions.${number}.config`}
            render={({ field }) => (
              <Select
                value={(field.value as string | undefined) ?? 'BUTTONS'}
                onValueChange={field.onChange}
              >
                <SelectTrigger id={`${id}-display`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUTTONS">
                    {m.question_scale_buttons()}
                  </SelectItem>
                  <SelectItem value="SLIDER">
                    {m.question_scale_slider()}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={m.question_scale_min_label()} htmlFor={`${id}-min-label`}>
          <Input
            id={`${id}-min-label`}
            placeholder={m.question_scale_min_label_placeholder()}
            {...register(`${path}.config.minLabel` as never)}
          />
        </Field>
        <Field label={m.question_scale_max_label()} htmlFor={`${id}-max-label`}>
          <Input
            id={`${id}-max-label`}
            placeholder={m.question_scale_max_label_placeholder()}
            {...register(`${path}.config.maxLabel` as never)}
          />
        </Field>
      </div>
    </div>
  );
}

function NumberSettings({
  path,
  id,
  errors,
}: {
  path: Path;
  id: string;
  errors?: Record<string, { message?: string } | undefined>;
}) {
  const { control, register } = useFormContext<QuestionnaireInputDraft>();
  const metric = useWatch({ control, name: `${path}.metricType` });
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Field label={m.question_number_unit()} htmlFor={`${id}-unit`}>
        <Input
          id={`${id}-unit`}
          placeholder={m.question_number_unit_placeholder()}
          // Set by the metric the answer fills
          readOnly={Boolean(metric)}
          {...register(`${path}.config.unit` as never)}
        />
      </Field>
      <Field label={m.question_number_min()} htmlFor={`${id}-min`}>
        <NumberInput
          name={`${path}.config.min`}
          id={`${id}-min`}
          nullable
          placeholder={m.question_optional()}
        />
      </Field>
      <Field
        label={m.question_number_max()}
        htmlFor={`${id}-max`}
        error={editorErrorMessage(errors?.max?.message)}
      >
        <NumberInput
          name={`${path}.config.max`}
          id={`${id}-max`}
          nullable
          placeholder={m.question_optional()}
        />
      </Field>
      <Field label={m.question_number_decimals()} htmlFor={`${id}-decimals`}>
        <Controller
          control={control}
          name={`${path}.config.decimals` as `questions.${number}.config`}
          render={({ field }) => (
            <Select
              value={String(field.value ?? 1)}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger id={`${id}-decimals`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3].map((decimals) => (
                  <SelectItem key={decimals} value={String(decimals)}>
                    {decimals}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
    </div>
  );
}

function ChoiceSettings({ path, id }: { path: Path; id: string }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<QuestionnaireInputDraft>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${path}.config.options` as `questions.${number}.config.options`,
  } as never);
  const index = Number(path.split('.')[1]);
  const optionErrors = (
    errors.questions?.[index]?.config as
      | {
          options?: { message?: string; root?: { message?: string } } & Record<
            number,
            { label?: { message?: string } }
          >;
        }
      | undefined
  )?.options;

  return (
    <div className="space-y-2">
      <Label>{m.question_options()}</Label>
      <ul className="space-y-2">
        {fields.map((field, optionIndex) => (
          <li key={field.id} className="flex items-center gap-2">
            <Input
              aria-label={m.question_option_number({ number: optionIndex + 1 })}
              id={`${id}-option-${optionIndex}`}
              {...register(
                `${path}.config.options.${optionIndex}.label` as never,
              )}
              aria-invalid={Boolean(optionErrors?.[optionIndex]?.label)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={fields.length <= 2}
              onClick={() => remove(optionIndex)}
              aria-label={m.question_option_remove()}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
      {(optionErrors?.message || optionErrors?.root?.message) && (
        <p role="alert" className="text-xs text-destructive">
          {editorErrorMessage(
            optionErrors?.message ?? optionErrors?.root?.message,
          )}
        </p>
      )}
      {Object.keys(optionErrors ?? {}).some((key) => /^\d+$/.test(key)) && (
        <p role="alert" className="text-xs text-destructive">
          {m.question_option_empty()}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= QUESTION_MAX_OPTIONS}
        onClick={() => append({ id: newOptionId(), label: '' } as never)}
      >
        <Plus />
        {m.question_option_add()}
      </Button>
    </div>
  );
}
