'use client';

import { cn } from '@/utils/shadcn';
import { useId, useState } from 'react';

/** Same coefficients as apps/api/src/common/constants/training-formulas.constants.ts */
const COEFFICIENTS = {
  male: { y: 0.64, k: 1.92 },
  female: { y: 0.86, k: 1.67 },
} as const;

type Sex = keyof typeof COEFFICIENTS;

export interface TrimpLabels {
  duration: string;
  avgHr: string;
  hrMax: string;
  hrRest: string;
  male: string;
  female: string;
  result: string;
  reserve: string;
  minutes: string;
}

function Field({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between text-[0.85rem]">
        <label htmlFor={id} className="text-white/70">
          {label}
        </label>
        <span className="font-mono text-white tabular-nums">
          {value} <span className="text-white/45">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#6ec1fc]"
      />
    </div>
  );
}

/**
 * Banister TRIMP from an average heart rate, with the app's coefficients.
 * The app integrates the heart rate second by second when it has a stream.
 */
export function TrimpCalculator({ labels }: { labels: TrimpLabels }) {
  const [minutes, setMinutes] = useState(60);
  const [hr, setHr] = useState(150);
  const [hrMax, setHrMax] = useState(190);
  const [hrRest, setHrRest] = useState(50);
  const [sex, setSex] = useState<Sex>('male');

  const reserve = Math.max(0, (hr - hrRest) / Math.max(1, hrMax - hrRest));
  const { y, k } = COEFFICIENTS[sex];
  const trimp = minutes * reserve * y * Math.exp(k * reserve);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={labels.duration}
          value={minutes}
          unit={labels.minutes}
          min={10}
          max={240}
          onChange={setMinutes}
        />
        <Field
          label={labels.avgHr}
          value={hr}
          unit="bpm"
          min={80}
          max={200}
          onChange={setHr}
        />
        <Field
          label={labels.hrMax}
          value={hrMax}
          unit="bpm"
          min={150}
          max={215}
          onChange={setHrMax}
        />
        <Field
          label={labels.hrRest}
          value={hrRest}
          unit="bpm"
          min={35}
          max={80}
          onChange={setHrRest}
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-2" role="radiogroup">
        {(['male', 'female'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={sex === option}
            onClick={() => setSex(option)}
            className={cn(
              'h-9 rounded-full px-4 text-[0.85rem] whitespace-nowrap transition-colors',
              sex === option
                ? 'bg-white text-ink'
                : 'border border-white/15 text-white/70 hover:text-white',
            )}
          >
            {labels[option]}
          </button>
        ))}
      </div>
      <div className="mt-7 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <p className="font-mono text-[0.78rem] leading-6 break-words text-white/55">
          {labels.reserve} = ({hr} − {hrRest}) / ({hrMax} − {hrRest}) ={' '}
          <span className="text-white">{reserve.toFixed(3)}</span>
          <br />
          {minutes} × {reserve.toFixed(3)} × {y} × e^({k} × {reserve.toFixed(3)}
          )
        </p>
        <p className="text-right">
          <span className="block font-mono text-[0.72rem] tracking-wide text-white/50 uppercase">
            {labels.result}
          </span>
          <span className="text-5xl font-semibold tracking-[-0.04em] text-white tabular-nums">
            {Math.round(trimp)}
          </span>
        </p>
      </div>
    </div>
  );
}
