'use client';

import { useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { useId, useState } from 'react';

type Row = {
  key: 'easy' | 'tempo' | 'vma' | 'long' | 'uphill' | 'hills';
  kind: 'vma' | 'hr';
  min: number;
  max: number;
};

/** The same fractions the plan files carry. */
const ROWS: Row[] = [
  { key: 'easy', kind: 'vma', min: 0.62, max: 0.7 },
  { key: 'tempo', kind: 'vma', min: 0.82, max: 0.87 },
  { key: 'vma', kind: 'vma', min: 0.9, max: 0.95 },
  { key: 'long', kind: 'hr', min: 0.65, max: 0.75 },
  { key: 'uphill', kind: 'hr', min: 0.82, max: 0.87 },
  { key: 'hills', kind: 'hr', min: 0.88, max: 0.95 },
];

function pace(kmh: number): string {
  const seconds = Math.round(3600 / kmh);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Shows what the relative targets of the plans become for one athlete, as
 * the app does when it sends a session to the watch.
 */
export function TrailTargetsCalculator() {
  const ml = useMessageLocale();
  const id = useId();
  const [vma, setVma] = useState(14);
  const [hrMax, setHrMax] = useState(185);
  const validVma = vma >= 8 && vma <= 25;
  const validHr = hrMax >= 120 && hrMax <= 230;

  const labels: Record<Row['key'], string> = {
    easy: m.trailplan_calc_row_easy({}, { locale: ml }),
    tempo: m.trailplan_calc_row_tempo({}, { locale: ml }),
    vma: m.trailplan_calc_row_vma({}, { locale: ml }),
    long: m.trailplan_calc_row_long({}, { locale: ml }),
    uphill: m.trailplan_calc_row_uphill({}, { locale: ml }),
    hills: m.trailplan_calc_row_hills({}, { locale: ml }),
  };
  const bpm = m.trailplan_calc_bpm({}, { locale: ml });

  return (
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-7">
      <h3 className="text-[1.15rem] font-semibold tracking-[-0.01em] text-ink">
        {m.trailplan_calc_title({}, { locale: ml })}
      </h3>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <label htmlFor={`${id}-vma`} className="block">
          <span className="text-[0.8rem] text-muted-foreground">
            {m.trailplan_calc_vma({}, { locale: ml })}
          </span>
          <input
            id={`${id}-vma`}
            type="number"
            inputMode="decimal"
            min={8}
            max={25}
            step={0.5}
            value={vma}
            onChange={(e) => setVma(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-paper px-3 py-2 font-mono text-[1.05rem] text-ink tabular-nums focus:border-ink/40 focus:outline-none"
          />
        </label>
        <label htmlFor={`${id}-hr`} className="block">
          <span className="text-[0.8rem] text-muted-foreground">
            {m.trailplan_calc_hrmax({}, { locale: ml })}
          </span>
          <input
            id={`${id}-hr`}
            type="number"
            inputMode="numeric"
            min={120}
            max={230}
            step={1}
            value={hrMax}
            onChange={(e) => setHrMax(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-paper px-3 py-2 font-mono text-[1.05rem] text-ink tabular-nums focus:border-ink/40 focus:outline-none"
          />
        </label>
      </div>

      <table className="mt-5 w-full text-left text-[0.9rem]">
        <tbody className="divide-y divide-border">
          {ROWS.map((row) => {
            const { key } = row;
            const percent = `${Math.round(row.min * 100)}–${Math.round(row.max * 100)}`;
            let value = '–';
            if (row.kind === 'vma' && validVma) {
              // Slower bound first, as a watch shows a pace range
              value = `${pace(vma * row.min)}–${pace(vma * row.max)} /km`;
            } else if (row.kind === 'hr' && validHr) {
              value = `${Math.round(hrMax * row.min)}–${Math.round(hrMax * row.max)} ${bpm}`;
            }
            return (
              <tr key={key}>
                <td className="py-2.5 pr-3">
                  <span className="block font-medium text-ink">
                    {labels[key]}
                  </span>
                  <span className="text-[0.78rem] text-muted-foreground">
                    {row.kind === 'vma'
                      ? m.trailplan_t_vma({ range: percent }, { locale: ml })
                      : m.trailplan_t_hr({ range: percent }, { locale: ml })}
                  </span>
                </td>
                <td className="py-2.5 text-right font-mono whitespace-nowrap text-ink tabular-nums">
                  {value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-4 text-[0.8rem] text-muted-foreground">
        {m.trailplan_calc_note({}, { locale: ml })}
      </p>
    </div>
  );
}
