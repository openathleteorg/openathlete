import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useId } from 'react';

import {
  type AnswerError,
  type AnswerInput,
  LONG_TEXT_ANSWER_MAX,
  QUESTION_TYPE,
  type Question,
  SHORT_TEXT_ANSWER_MAX,
  scalePoints,
} from '@openathlete/shared';

import { answerErrorMessage } from './answer-format';

/** Past this many points a scale is a slider: buttons would wrap */
const MAX_SCALE_BUTTONS = 11;

/** A choice among a few, as large buttons easy to touch */
function ChoiceButton({
  selected,
  onClick,
  children,
  role,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role: 'radio' | 'checkbox';
  className?: string;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-md border px-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background hover:bg-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}

interface P {
  question: Question;
  value: AnswerInput;
  onChange: (value: AnswerInput) => void;
  error?: AnswerError;
  disabled?: boolean;
}

/** One question, as the athlete answers it */
export function QuestionField({
  question,
  value,
  onChange,
  error,
  disabled,
}: P) {
  const id = useId();
  const set = (change: Partial<AnswerInput>) =>
    onChange({ ...value, ...change });

  return (
    <fieldset
      className="space-y-3"
      aria-invalid={Boolean(error)}
      aria-describedby={question.help ? `${id}-help` : undefined}
      disabled={disabled}
      data-question={question.questionId}
    >
      <legend className="text-sm font-medium">
        {question.label}
        {question.required && (
          <span className="text-muted-foreground" aria-hidden>
            {' '}
            *
          </span>
        )}
      </legend>
      {question.help && (
        <p id={`${id}-help`} className="-mt-2 text-xs text-muted-foreground">
          {question.help}
        </p>
      )}

      <Control question={question} value={value} set={set} id={id} />

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {answerErrorMessage(error)}
        </p>
      )}
    </fieldset>
  );
}

function Control({
  question,
  value,
  set,
  id,
}: {
  question: Question;
  value: AnswerInput;
  set: (change: Partial<AnswerInput>) => void;
  id: string;
}) {
  switch (question.type) {
    case QUESTION_TYPE.SHORT_TEXT:
      return (
        <Input
          id={id}
          value={value.valueText ?? ''}
          maxLength={SHORT_TEXT_ANSWER_MAX}
          onChange={(event) => set({ valueText: event.target.value })}
        />
      );
    case QUESTION_TYPE.LONG_TEXT:
      return (
        <Textarea
          id={id}
          rows={4}
          value={value.valueText ?? ''}
          maxLength={LONG_TEXT_ANSWER_MAX}
          onChange={(event) => set({ valueText: event.target.value })}
        />
      );
    case QUESTION_TYPE.SCALE: {
      const points = scalePoints(question.config);
      const { minLabel, maxLabel } = question.config;
      const ends = (minLabel || maxLabel) && (
        <div className="flex justify-between gap-4 text-xs text-muted-foreground">
          <span>{minLabel}</span>
          <span className="text-right">{maxLabel}</span>
        </div>
      );
      if (
        question.config.display === 'BUTTONS' &&
        points.length <= MAX_SCALE_BUTTONS
      ) {
        return (
          <div className="space-y-2">
            <div
              role="radiogroup"
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
              }}
            >
              {points.map((point) => (
                <ChoiceButton
                  key={point}
                  role="radio"
                  selected={value.valueNumber === point}
                  onClick={() =>
                    set({
                      valueNumber: value.valueNumber === point ? null : point,
                    })
                  }
                  className="px-0 tabular-nums"
                >
                  {point}
                </ChoiceButton>
              ))}
            </div>
            {ends}
          </div>
        );
      }
      const current = value.valueNumber;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              id={id}
              type="range"
              min={question.config.min}
              max={question.config.max}
              step={question.config.step}
              // Unanswered, the thumb waits in the middle without a value
              value={current ?? (question.config.min + question.config.max) / 2}
              onChange={(event) =>
                set({ valueNumber: Number(event.target.value) })
              }
              className={cn(
                'h-11 w-full accent-primary',
                current === null && 'opacity-50',
              )}
              aria-valuetext={
                current === null ? m.questionnaire_not_answered() : undefined
              }
            />
            <span className="w-12 text-right text-lg font-semibold tabular-nums">
              {current ?? '–'}
            </span>
          </div>
          {ends}
        </div>
      );
    }
    case QUESTION_TYPE.NUMBER: {
      const { unit, min, max, decimals } = question.config;
      return (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="number"
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            className="max-w-40"
            min={min ?? undefined}
            max={max ?? undefined}
            step={decimals > 0 ? 1 / 10 ** decimals : 1}
            value={value.valueNumber ?? ''}
            onChange={(event) =>
              set({
                valueNumber:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
      );
    }
    case QUESTION_TYPE.YES_NO:
      return (
        <div role="radiogroup" className="grid max-w-xs grid-cols-2 gap-2">
          {[
            { value: 1, label: m.questionnaire_yes() },
            { value: 0, label: m.questionnaire_no() },
          ].map((option) => (
            <ChoiceButton
              key={option.value}
              role="radio"
              selected={value.valueNumber === option.value}
              onClick={() =>
                set({
                  valueNumber:
                    value.valueNumber === option.value ? null : option.value,
                })
              }
            >
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      );
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE: {
      const multiple = question.type === QUESTION_TYPE.MULTIPLE_CHOICE;
      return (
        <div
          role={multiple ? 'group' : 'radiogroup'}
          className="flex flex-wrap gap-2"
        >
          {question.config.options.map((option) => {
            const selected = value.valueOptions.includes(option.id);
            return (
              <ChoiceButton
                key={option.id}
                role={multiple ? 'checkbox' : 'radio'}
                selected={selected}
                onClick={() =>
                  set({
                    valueOptions: multiple
                      ? selected
                        ? value.valueOptions.filter((id) => id !== option.id)
                        : [...value.valueOptions, option.id]
                      : selected
                        ? []
                        : [option.id],
                  })
                }
              >
                {option.label}
              </ChoiceButton>
            );
          })}
        </div>
      );
    }
  }
}
