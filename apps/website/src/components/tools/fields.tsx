'use client';

import { cn } from '@/utils/shadcn';
import { type ReactNode, useId } from 'react';

const inputClass =
  'h-12 w-full rounded-xl border border-input bg-white px-4 font-mono text-[1.05rem] text-ink tabular-nums shadow-[0_1px_2px_rgb(5_12_52/0.05)] transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/60 focus:border-sky-strong focus:ring-[3px] focus:ring-sky/30 disabled:bg-paper disabled:text-muted-foreground';

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[0.88rem] font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[0.8rem] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  disabled,
  placeholder,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, suffix && 'pr-16')}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

/** A duration typed as h:mm:ss or mm:ss; colons are optional to type. */
export function DurationField({
  label,
  hint,
  value,
  onChange,
  disabled,
  placeholder = '0:00:00',
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value.replace(/[^\d:]/g, '').slice(0, 9))
        }
        className={inputClass}
      />
    </Field>
  );
}

/** Pill-shaped radio group. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 rounded-full border px-4 text-sm font-medium transition-colors',
              active
                ? 'border-ink bg-ink text-white'
                : 'border-border bg-white text-ink hover:border-ink/30',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The panel holding a calculator: inputs on the left, result on the right. */
export function CalculatorShell({
  inputs,
  result,
}: {
  inputs: ReactNode;
  result: ReactNode;
}) {
  return (
    <div className="grid overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_40px_80px_-48px_rgb(5_12_52/0.45)] lg:grid-cols-[1fr_1.05fr]">
      <div className="space-y-6 p-6 sm:p-9">{inputs}</div>
      <div className="ink-band relative overflow-hidden p-6 sm:p-9">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative" aria-live="polite">
          {result}
        </div>
      </div>
    </div>
  );
}

export function BigResult({
  label,
  value,
  unit,
  sub,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div>
      <p className="kicker text-ink-soft">{label}</p>
      <p className="mt-3 flex items-baseline gap-2 text-white">
        <span className="font-mono text-[clamp(2.8rem,6vw,4rem)] leading-none font-semibold tracking-[-0.04em] tabular-nums">
          {value}
        </span>
        {unit && <span className="text-lg text-ink-soft">{unit}</span>}
      </p>
      {sub && <p className="mt-3 text-[0.92rem] text-ink-soft">{sub}</p>}
    </div>
  );
}
