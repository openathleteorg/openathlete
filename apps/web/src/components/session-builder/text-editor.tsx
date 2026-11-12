import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { AlertCircle, Info } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { CreateWorkoutStepDto } from '@openathlete/shared';
import { serializeWorkoutText } from '@openathlete/shared';

import { issueMessage } from './issue-message';
import { parseLines } from './line-parse';
import type { BuilderEnv } from './use-builder-env';

interface TextEditorProps {
  steps: CreateWorkoutStepDto[];
  env: BuilderEnv;
  /** Called with the steps the text gives, once it reads without error */
  onChange: (steps: CreateWorkoutStepDto[]) => void;
}

const LINE_HEIGHT = 24;

/**
 * The session as text, compatible with Intervals.icu: paste one, or type
 * faster than any mouse. Lines that do not read are marked in the margin
 * and explained below; the blocks follow once the text is clean.
 */
export function TextEditor({ steps, env, onChange }: TextEditorProps) {
  const [text, setText] = useState(() =>
    serializeWorkoutText(steps, {
      sport: env.sport,
      zones: env.zones,
      locale: env.locale,
    }),
  );
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const result = useMemo(() => parseLines(text, env), [text, env]);
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  const lineCount = text.split('\n').length;
  const errorLines = new Set(errors.map((issue) => issue.line));
  const warningLines = new Set(
    result.issues
      .filter((issue) => issue.severity === 'warning')
      .map((issue) => issue.line),
  );

  const latest = useRef(onChange);
  latest.current = onChange;
  // Steps typed but not handed over yet: leaving the text gives them
  const pending = useRef<CreateWorkoutStepDto[] | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (errors.length) {
      pending.current = null;
      return;
    }
    pending.current = result.steps;
    const timer = window.setTimeout(() => {
      pending.current = null;
      latest.current(result.steps);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [result, errors.length]);
  useEffect(
    () => () => {
      if (pending.current) latest.current(pending.current);
    },
    [],
  );

  const goToLine = (line: number) => {
    const element = area.current;
    if (!element) return;
    const lines = text.split('\n');
    const start = lines
      .slice(0, line)
      .reduce((sum, l) => sum + l.length + 1, 0);
    element.focus();
    element.setSelectionRange(start, start + (lines[line]?.length ?? 0));
  };

  return (
    <div className="space-y-2" data-text-editor>
      <div className="flex overflow-hidden rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring/30">
        <div
          ref={gutter}
          className="w-9 shrink-0 select-none overflow-hidden border-r bg-muted/40 py-2 text-right font-mono text-[11px] text-muted-foreground"
          aria-hidden
        >
          {Array.from({ length: lineCount }, (_, line) => (
            <div
              key={line}
              style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
              className={cn(
                'pr-2',
                errorLines.has(line) &&
                  'bg-destructive/10 font-semibold text-destructive',
                !errorLines.has(line) &&
                  warningLines.has(line) &&
                  'text-foreground',
              )}
            >
              {line + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={area}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          onScroll={(event) => {
            if (gutter.current)
              gutter.current.scrollTop = event.currentTarget.scrollTop;
          }}
          rows={Math.max(8, Math.min(lineCount + 2, 22))}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          className="block w-full resize-y whitespace-pre bg-transparent px-3 py-2 font-mono text-sm outline-none"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
          aria-label={m.builder_text_label()}
          placeholder={m.builder_text_placeholder()}
        />
      </div>
      {result.issues.length > 0 ? (
        <ul className="space-y-1 text-xs" role="status">
          {result.issues.slice(0, 6).map((issue, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => goToLine(issue.line)}
                className={cn(
                  'flex items-start gap-1.5 text-left hover:underline',
                  issue.severity === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {issue.severity === 'error' ? (
                  <AlertCircle className="mt-px size-3.5 shrink-0" />
                ) : (
                  <Info className="mt-px size-3.5 shrink-0" />
                )}
                <span>
                  {m.builder_text_line({ line: issue.line + 1 })} ·{' '}
                  {issueMessage(issue.code, issue.text)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{m.builder_text_help()}</p>
      )}
    </div>
  );
}
