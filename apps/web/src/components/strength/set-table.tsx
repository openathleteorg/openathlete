import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Plus, X } from 'lucide-react';
import { type KeyboardEvent, useEffect, useState } from 'react';

import type { StrengthSet } from '@openathlete/shared';
import { WORKOUT_DURATION_TYPE } from '@openathlete/shared';

import { type SetColumns, gridColumns } from './set-columns';
import {
  formatSeconds,
  formatWork,
  parseSeconds,
  parseWork,
} from './strength-input';

/** A small text field that commits a parsed value when left or on Enter */
export function CellInput({
  value,
  parse,
  onCommit,
  placeholder,
  label,
  className,
  inputMode = 'text',
}: {
  value: string;
  parse: (text: string) => boolean;
  onCommit: (text: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = !text.trim() || parse(text);
  const commit = () => {
    if (text === value) return;
    if (valid) onCommit(text);
    else setText(value);
  };
  return (
    <input
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onFocus={(event) => event.target.select()}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
          event.preventDefault();
          (event.target as HTMLInputElement).blur();
        }
      }}
      placeholder={placeholder}
      aria-label={label}
      aria-invalid={!valid}
      inputMode={inputMode}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-transparent bg-muted/60 px-2 text-center text-sm tabular-nums outline-none transition-colors hover:border-input focus:border-ring focus:bg-background aria-invalid:border-destructive',
        className,
      )}
    />
  );
}

const loadOf = (text: string): number | null | undefined => {
  const value = text.replace(',', '.').replace(/kg/i, '').trim();
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1000
    ? number
    : undefined;
};
const rpeOf = (text: string): number | null | undefined => {
  const value = text.replace(',', '.').trim();
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 10
    ? number
    : undefined;
};

/** Inputs of one set, the same in a table and in a group */
export function SetCells({
  set,
  columns,
  onChange,
  restLabel = m.strength_rest(),
}: {
  set: StrengthSet;
  columns: SetColumns;
  onChange: (set: StrengthSet) => void;
  restLabel?: string;
}) {
  const unit =
    set.work.type === WORKOUT_DURATION_TYPE.REPS
      ? m.strength_reps_short()
      : set.work.type === WORKOUT_DURATION_TYPE.TIME
        ? ''
        : 'm';
  return (
    <>
      <div className="relative">
        <CellInput
          value={formatWork(set.work)}
          parse={(text) => !!parseWork(text, set.work.type)}
          onCommit={(text) => {
            const work = parseWork(text, set.work.type);
            if (work) onChange({ ...set, work });
          }}
          label={m.strength_work()}
          className="pr-6 font-semibold"
        />
        {unit && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {columns.load && (
        <div className="relative">
          <CellInput
            value={set.load === null ? '' : String(set.load)}
            parse={(text) => loadOf(text) !== undefined}
            onCommit={(text) =>
              onChange({ ...set, load: loadOf(text) ?? null })
            }
            label={m.strength_load()}
            placeholder="—"
            inputMode="decimal"
            className="pr-6"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            kg
          </span>
        </div>
      )}
      {columns.rpe && (
        <CellInput
          value={set.rpe === null ? '' : String(set.rpe)}
          parse={(text) => rpeOf(text) !== undefined}
          onCommit={(text) => onChange({ ...set, rpe: rpeOf(text) ?? null })}
          label="RPE"
          placeholder="—"
          inputMode="decimal"
        />
      )}
      {columns.rest && (
        <CellInput
          value={formatSeconds(set.rest)}
          parse={(text) => parseSeconds(text) !== null}
          onCommit={(text) => onChange({ ...set, rest: parseSeconds(text) })}
          label={restLabel}
          placeholder="—"
        />
      )}
    </>
  );
}

/** The sets of one exercise, a row each: what to do, with what, then rest */
export function SetTable({
  sets,
  columns,
  onChange,
}: {
  sets: StrengthSet[];
  columns: SetColumns;
  onChange: (sets: StrengthSet[]) => void;
}) {
  const template = gridColumns(columns, '1.75rem', '2rem');
  const header = [
    m.strength_set_short(),
    m.strength_work(),
    columns.load && m.strength_load(),
    columns.rpe && 'RPE',
    columns.rest && m.strength_rest(),
    '',
  ].filter((label) => label !== false);

  const add = () => {
    const last = sets[sets.length - 1];
    if (!last) return;
    onChange([...sets, { ...last, work: { ...last.work } }]);
  };

  return (
    <div className="space-y-1" data-set-table>
      <div
        className="grid items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns: template }}
      >
        {header.map((label, index) => (
          <span key={index} className={cn(index > 0 && 'text-center')}>
            {label}
          </span>
        ))}
      </div>
      {sets.map((set, index) => (
        <div
          key={index}
          className="grid items-center gap-1.5"
          style={{ gridTemplateColumns: template }}
          data-set-row={index}
        >
          <span className="text-center text-sm font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <SetCells
            set={set}
            columns={columns}
            onChange={(next) =>
              onChange(sets.map((item, i) => (i === index ? next : item)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            disabled={sets.length === 1}
            aria-label={m.strength_remove_set()}
            onClick={() => onChange(sets.filter((_, i) => i !== index))}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-muted-foreground"
        onClick={add}
        data-add-set
      >
        <Plus className="size-3.5" />
        {m.strength_add_set()}
      </Button>
    </div>
  );
}
