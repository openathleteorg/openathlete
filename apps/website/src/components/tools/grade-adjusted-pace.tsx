'use client';

import { useLocale, useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { DATE_LOCALES } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { useState } from 'react';

import {
  BigResult,
  CalculatorShell,
  DurationField,
  Field,
  NumberField,
  Segmented,
} from './fields';
import { formatDuration, formatNumber, parseDuration } from './format';
import { MAX_GRADE, costRatio, flatEquivalentPace, paceOnGrade } from './grade';

const TABLE_GRADES = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];

type Mode = 'to-flat' | 'to-slope';

/** Minetti's cost curve from −30% to +30%, with the entered gradient on it. */
function CostCurve({ grade, label }: { grade: number; label: string }) {
  const width = 320;
  const height = 130;
  const maxRatio = 3.6;
  const x = (g: number) => ((g + MAX_GRADE) / (2 * MAX_GRADE)) * width;
  const y = (r: number) => height - (r / maxRatio) * height;
  const points = Array.from({ length: 61 }, (_, index) => {
    const g = -MAX_GRADE + index / 100;
    return `${x(g).toFixed(1)},${y(costRatio(g)).toFixed(1)}`;
  }).join(' ');
  const g = Math.max(-MAX_GRADE, Math.min(MAX_GRADE, grade));
  return (
    <figure className="rounded-2xl border border-border bg-paper p-5">
      <svg
        viewBox={`-8 -8 ${width + 16} ${height + 30}`}
        className="h-auto w-full"
        aria-hidden
      >
        <line
          x1={0}
          x2={width}
          y1={y(1)}
          y2={y(1)}
          className="stroke-border"
          strokeDasharray="4 4"
        />
        <line
          x1={x(0)}
          x2={x(0)}
          y1={0}
          y2={height}
          className="stroke-border"
        />
        <polyline
          points={points}
          fill="none"
          className="stroke-sky-strong"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <circle
          cx={x(g)}
          cy={y(costRatio(g))}
          r={6}
          className="fill-coral stroke-white"
          strokeWidth={2}
        />
        <text
          x={width}
          y={y(1) - 6}
          textAnchor="end"
          className="fill-muted-foreground font-mono text-[11px]"
        >
          ×1
        </text>
        {[-30, 0, 30].map((tick) => (
          <text
            key={tick}
            x={x(tick / 100)}
            y={height + 18}
            textAnchor={tick < 0 ? 'start' : tick > 0 ? 'end' : 'middle'}
            className="fill-muted-foreground font-mono text-[11px]"
          >
            {tick > 0 ? `+${tick}` : tick}%
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 text-[0.8rem] text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

export function GradeAdjustedPace() {
  const ml = useMessageLocale();
  const locale = DATE_LOCALES[useLocale()];
  const [mode, setMode] = useState<Mode>('to-flat');
  const [pace, setPace] = useState('6:00');
  const [gradeInput, setGradeInput] = useState('10');

  const seconds = parseDuration(pace);
  const percent = Number(gradeInput);
  const valid = seconds >= 60 && seconds < 3600 && Number.isFinite(percent);
  const grade = valid ? percent / 100 : 0;
  const clamped = Math.abs(grade) > MAX_GRADE;

  // The flat effort the table is built on, whichever way the user entered it
  const flatPace = !valid
    ? 0
    : mode === 'to-flat'
      ? flatEquivalentPace(seconds, grade)
      : seconds;
  const result = !valid
    ? 0
    : mode === 'to-flat'
      ? flatPace
      : paceOnGrade(seconds, grade);
  const ratio = costRatio(grade);
  const perKm = m.tools_common_per_km({}, { locale: ml });

  return (
    <CalculatorShell
      inputs={
        <>
          <Field label={m.tools_gap_mode({}, { locale: ml })}>
            <Segmented
              label={m.tools_gap_mode({}, { locale: ml })}
              value={mode}
              onChange={setMode}
              options={[
                {
                  value: 'to-flat',
                  label: m.tools_gap_mode_to_flat({}, { locale: ml }),
                },
                {
                  value: 'to-slope',
                  label: m.tools_gap_mode_to_slope({}, { locale: ml }),
                },
              ]}
            />
          </Field>
          <DurationField
            label={
              mode === 'to-flat'
                ? m.tools_gap_pace_slope({}, { locale: ml })
                : m.tools_gap_pace_flat({}, { locale: ml })
            }
            hint={m.tools_gap_pace_hint({}, { locale: ml })}
            value={pace}
            onChange={setPace}
            placeholder="0:00"
          />
          <NumberField
            label={m.tools_gap_grade({}, { locale: ml })}
            hint={m.tools_gap_grade_hint({}, { locale: ml })}
            value={gradeInput}
            onChange={setGradeInput}
            suffix="%"
            min={-30}
            max={30}
            step={1}
          />
          <CostCurve
            grade={grade}
            label={m.tools_gap_curve({}, { locale: ml })}
          />
        </>
      }
      result={
        <>
          <BigResult
            label={
              mode === 'to-flat'
                ? m.tools_gap_result_flat({}, { locale: ml })
                : m.tools_gap_result_slope({}, { locale: ml })
            }
            value={valid ? formatDuration(result) : '–'}
            unit={perKm}
            sub={
              valid
                ? m.tools_gap_cost(
                    { ratio: formatNumber(ratio, locale, 2) },
                    { locale: ml },
                  ) +
                  (clamped ? ` ${m.tools_gap_clamped({}, { locale: ml })}` : '')
                : undefined
            }
          />
          <p className="kicker mt-9 text-ink-soft">
            {m.tools_gap_table_title(
              { pace: valid ? formatDuration(flatPace) : '–' },
              { locale: ml },
            )}
          </p>
          <table className="mt-3 w-full text-left">
            <thead>
              <tr className="kicker text-ink-soft">
                <th className="pb-2 font-medium">
                  {m.tools_gap_col_grade({}, { locale: ml })}
                </th>
                <th className="pb-2 text-right font-medium">
                  {m.tools_gap_col_cost({}, { locale: ml })}
                </th>
                <th className="pb-2 text-right font-medium">
                  {m.tools_common_pace({}, { locale: ml })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 border-y border-white/10">
              {TABLE_GRADES.map((g) => {
                const current =
                  valid &&
                  Math.round(Math.max(-30, Math.min(30, percent))) === g;
                const steepDown = g <= -15;
                return (
                  <tr
                    key={g}
                    className={cn(
                      'text-white',
                      current && 'bg-white/[0.08]',
                      steepDown && 'text-ink-soft',
                    )}
                  >
                    <td className="py-2 pl-2 font-mono text-[0.9rem] tabular-nums">
                      {g > 0 ? `+${g}` : g}%
                    </td>
                    <td className="py-2 text-right font-mono text-[0.9rem] tabular-nums">
                      ×{formatNumber(costRatio(g / 100), locale, 2)}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono tabular-nums">
                      {valid
                        ? formatDuration(paceOnGrade(flatPace, g / 100))
                        : '–'}
                      {steepDown && '*'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-[0.8rem] leading-relaxed text-ink-soft">
            * {m.tools_gap_downhill_note({}, { locale: ml })}
          </p>
        </>
      }
    />
  );
}
