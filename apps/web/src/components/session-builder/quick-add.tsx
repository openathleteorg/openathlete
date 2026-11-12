import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { CornerDownLeft, Sparkles } from 'lucide-react';
import { forwardRef, useMemo, useState } from 'react';

import type { CreateWorkoutStepDto } from '@openathlete/shared';

import { issueMessage } from './issue-message';
import { parseLines } from './line-parse';
import { describeSteps, quickExamples } from './quick-add-text';
import type { BuilderEnv } from './use-builder-env';

interface QuickAddProps {
  env: BuilderEnv;
  onAdd: (steps: CreateWorkoutStepDto[]) => void;
  className?: string;
}

/**
 * One field to write the session as fast as it is said: "15' Z2",
 * "6x(1km Z4 / 2' Z1)", Enter. What it understood shows as you type.
 */
export const QuickAdd = forwardRef<HTMLInputElement, QuickAddProps>(
  function QuickAdd({ env, onAdd, className }, ref) {
    const [text, setText] = useState('');
    const result = useMemo(
      () =>
        text.trim() ? parseLines(text.replace(/\s*;\s*/g, '\n'), env) : null,
      [text, env],
    );
    const error = result?.issues.find((issue) => issue.severity === 'error');
    const ready = !!result && !error && result.steps.length > 0;

    const submit = () => {
      if (!ready || !result) return;
      onAdd(result.steps);
      setText('');
    };

    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="relative">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={ref}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              // Enter adds the steps; it must not submit the event form
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={m.builder_quick_placeholder({
              example: quickExamples(env)[1],
            })}
            className="h-11 pl-9 pr-24 font-mono text-sm"
            aria-label={m.builder_quick_label()}
            aria-invalid={!!error}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            data-quick-add
          />
          <Button
            type="button"
            size="sm"
            disabled={!ready}
            onClick={submit}
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            <CornerDownLeft />
            {m.builder_quick_add()}
          </Button>
        </div>
        <div className="flex min-h-7 flex-wrap items-center gap-1.5 text-xs">
          {result ? (
            error ? (
              <span className="text-destructive" role="status">
                {issueMessage(error.code, error.text)}
              </span>
            ) : (
              <span className="text-muted-foreground" role="status">
                → {describeSteps(result.steps)}
              </span>
            )
          ) : (
            quickExamples(env)
              // Examples with zones the athlete has not set would fail
              .filter((example) => {
                const parsed = parseLines(example, env);
                return !parsed.issues.some((i) => i.severity === 'error');
              })
              .map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => onAdd(parseLines(example, env).steps)}
                  className="rounded-full border px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  + {example}
                </button>
              ))
          )}
        </div>
      </div>
    );
  },
);
