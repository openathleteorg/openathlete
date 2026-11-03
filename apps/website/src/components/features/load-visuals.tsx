import { cn } from '@/utils/shadcn';

/** Daily weights of the impulse-response model, as in the API. */
const ALPHA_CTL = 1 - Math.exp(-1 / 42);
const ALPHA_ATL = 1 - Math.exp(-1 / 7);

const PAST = 42;
const FUTURE = 21;
const W = 640;
const H = 270;
const PAD = { top: 16, right: 12, bottom: 28, left: 12 };

/**
 * Six weeks of done training, then three planned weeks ending in a taper:
 * fitness and fatigue run solid up to today and dashed over the plan, form
 * as bars underneath.
 */
function simulate() {
  const loads: number[] = [];
  for (let day = 0; day < PAST + FUTURE; day++) {
    const week = Math.floor(day / 7);
    const pattern = [0.5, 1.2, 0.7, 1.1, 0, 0.8, 1.6][day % 7];
    let base = 70 + week * 4;
    if (week === 3) base *= 0.65;
    if (day >= PAST + 7) base *= 0.55;
    if (day >= PAST + 14) base *= 0.6;
    const jitter = 1 + 0.08 * Math.sin(day * 1.7);
    loads.push(Math.round(base * pattern * jitter));
  }
  let ctl = 52;
  let atl = 58;
  return loads.map((load) => {
    ctl = ALPHA_CTL * load + (1 - ALPHA_CTL) * ctl;
    atl = ALPHA_ATL * load + (1 - ALPHA_ATL) * atl;
    return { load, ctl, atl, tsb: ctl - atl };
  });
}

export function ProjectionChart({
  labels,
}: {
  labels: {
    fitness: string;
    fatigue: string;
    form: string;
    today: string;
    planned: string;
    race: string;
  };
}) {
  const days = simulate();
  const n = days.length;
  const innerW = W - PAD.left - PAD.right;
  const lineH = 150;
  const max = Math.max(...days.map((d) => Math.max(d.ctl, d.atl))) * 1.1;
  const x = (i: number) => PAD.left + (i / (n - 1)) * innerW;
  const y = (v: number) => PAD.top + lineH - (v / max) * lineH;
  const path = (key: 'ctl' | 'atl', from: number, to: number) =>
    days
      .slice(from, to + 1)
      .map(
        (d, i) =>
          `${i === 0 ? 'M' : 'L'}${x(from + i).toFixed(1)},${y(d[key]).toFixed(1)}`,
      )
      .join(' ');
  const zeroY = PAD.top + lineH + 42;
  const tsbScale = 1;
  const today = PAST - 1;
  const last = days[n - 1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.72rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#2f7fe0]" />
          {labels.fitness}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#d05ab4]" />
          {labels.fatigue}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#12a594]" />
          {labels.form}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-ink/40" />
          {labels.planned}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${labels.fitness}, ${labels.fatigue}, ${labels.form}`}
      >
        <rect
          x={x(today)}
          y={PAD.top - 6}
          width={x(n - 1) - x(today)}
          height={H - PAD.top - PAD.bottom + 6}
          fill="#f2f3f8"
          rx={6}
        />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#dfe2ec"
        />
        {days.map((d, i) => {
          const h = Math.abs(d.tsb) * tsbScale;
          return (
            <rect
              key={i}
              x={x(i) - 2.4}
              width={4.8}
              y={d.tsb >= 0 ? zeroY - h : zeroY}
              height={Math.max(h, 0.5)}
              rx={1}
              fill={d.tsb >= 0 ? '#12a594' : '#f4743b'}
              opacity={i > today ? 0.45 : 0.85}
            />
          );
        })}
        <path
          d={path('atl', 0, today)}
          fill="none"
          stroke="#d05ab4"
          strokeWidth={1.6}
        />
        <path
          d={path('atl', today, n - 1)}
          fill="none"
          stroke="#d05ab4"
          strokeWidth={1.6}
          strokeDasharray="4 4"
        />
        <path
          d={path('ctl', 0, today)}
          fill="none"
          stroke="#2f7fe0"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        <path
          d={path('ctl', today, n - 1)}
          fill="none"
          stroke="#2f7fe0"
          strokeWidth={2.6}
          strokeDasharray="5 5"
        />
        <line
          x1={x(today)}
          x2={x(today)}
          y1={PAD.top - 6}
          y2={H - PAD.bottom}
          stroke="#050c34"
          strokeOpacity={0.35}
        />
        <text
          x={x(today) - 6}
          y={H - 8}
          textAnchor="end"
          fontSize={11}
          className="font-mono"
          fill="#5e6684"
        >
          {labels.today}
        </text>
        <text
          x={W - PAD.right}
          y={H - 8}
          textAnchor="end"
          fontSize={11}
          className="font-mono"
          fill="#e2582a"
        >
          {labels.race} {last.tsb > 0 ? '+' : ''}
          {Math.round(last.tsb)}
        </text>
      </svg>
    </div>
  );
}

/** The form scale with the two conventions the app uses to describe it. */
export function FormGauge({
  labels,
}: {
  labels: { heavy: string; neutral: string; fresh: string; note: string };
}) {
  const min = -40;
  const max = 40;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  const ticks = [-40, -20, 0, 25, 40];
  return (
    <div>
      <div className="relative flex h-14 overflow-hidden rounded-xl text-[0.78rem] font-medium">
        <div
          className="flex items-center justify-center bg-coral/25 px-2 text-center text-coral-strong"
          style={{ width: pos(-20) }}
        >
          {labels.heavy}
        </div>
        <div
          className="flex items-center justify-center bg-sky/20 px-2 text-center text-sky-strong"
          style={{ width: `calc(${pos(25)} - ${pos(-20)})` }}
        >
          {labels.neutral}
        </div>
        <div className="flex flex-1 items-center justify-center bg-mint/25 px-2 text-center text-mint-strong">
          {labels.fresh}
        </div>
      </div>
      <div className="relative mt-2 h-4 font-mono text-[0.7rem] text-muted-foreground">
        {ticks.map((t) => (
          <span
            key={t}
            className={cn(
              'absolute -translate-x-1/2',
              t === min && 'translate-x-0',
              t === max && '-translate-x-full',
            )}
            style={{ left: pos(t) }}
          >
            {t > 0 ? `+${t}` : t}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[0.88rem] leading-relaxed text-muted-foreground">
        {labels.note}
      </p>
    </div>
  );
}
