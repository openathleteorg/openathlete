import { cn } from '@/utils/shadcn';
import { Check } from 'lucide-react';

const SKY = '#2f7fe0';
const ORCHID = '#d05ab4';
const MINT = '#12a594';

/** One Hooper answer, 1 to 7: fatigue, stress, soreness, sleep. */
const ANSWERS = [4, 3, 4, 2];

/** Twelve weekly Hooper scores (4 to 28), ending on this week's 13. */
const SCORES = [11, 12, 14, 13, 16, 18, 17, 20, 15, 12, 14, 13];

function linePath(
  values: number[],
  min: number,
  max: number,
  w: number,
  h: number,
  pad = 4,
) {
  return values
    .map((value, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (value - min) / (max - min)) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * A Hooper index as the athlete answers it: four 1–7 rows of buttons, then
 * the score and its weekly curve as the coach reads it.
 */
export function QuestionnaireCard({
  labels,
  className,
}: {
  labels: {
    title: string;
    meta: string;
    answered: string;
    questions: [string, string, string, string];
    low: string;
    high: string;
    score: string;
    weeks: string;
  };
  className?: string;
}) {
  const total = ANSWERS.reduce((sum, value) => sum + value, 0);
  const w = 220;
  const h = 56;
  const path = linePath(SCORES, 4, 28, w, h);
  const lastY = 4 + (1 - (SCORES[SCORES.length - 1] - 4) / 24) * (h - 8);

  return (
    <div className={cn('shot p-5 sm:p-6', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[0.95rem] font-semibold text-ink">
            {labels.title}
          </p>
          <p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">
            {labels.meta}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-mint/20 px-2.5 py-1 text-[0.72rem] font-medium text-mint-strong">
          <Check className="size-3.5" />
          {labels.answered}
        </span>
      </div>

      <ol className="mt-4 grid gap-3.5">
        {labels.questions.map((question, index) => (
          <li key={question}>
            <p className="text-[0.85rem] font-medium text-ink">{question}</p>
            <div
              className="mt-1.5 grid grid-cols-7 gap-1.5"
              role="img"
              aria-label={`${question}: ${ANSWERS[index]} / 7`}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((value) => {
                const selected = value === ANSWERS[index];
                return (
                  <span
                    key={value}
                    aria-hidden
                    className={cn(
                      'grid h-8 place-items-center rounded-lg border font-mono text-[0.78rem] tabular-nums',
                      selected
                        ? 'border-transparent text-white'
                        : 'border-border bg-paper text-ink/60',
                    )}
                    style={selected ? { background: SKY } : undefined}
                  >
                    {value}
                  </span>
                );
              })}
            </div>
            {index === 0 && (
              <div className="mt-1 flex justify-between text-[0.68rem] text-muted-foreground">
                <span>{labels.low}</span>
                <span>{labels.high}</span>
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-end justify-between gap-4 rounded-xl bg-paper px-4 py-3">
        <div>
          <p className="font-mono text-[0.68rem] text-muted-foreground">
            {labels.score}
          </p>
          <p className="mt-0.5 text-2xl font-semibold tracking-[-0.03em] text-ink tabular-nums">
            {total}
            <span className="text-[0.85rem] font-normal text-muted-foreground">
              {' '}
              / 28
            </span>
          </p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="ml-auto h-12 w-full max-w-[13rem] overflow-visible"
            role="img"
            aria-label={labels.weeks}
          >
            <path
              d={path}
              fill="none"
              stroke={SKY}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={w - 4} cy={lastY} r={3.5} fill={SKY} />
          </svg>
          <p className="font-mono text-[0.66rem] text-muted-foreground">
            {labels.weeks}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Eight days of yes/no answers: the yes days filled. */
const YES_NO = [true, true, false, true, true, true, false, true];

/** Answers to a one-choice question over a month. */
const CHOICES = [9, 5, 2];

/**
 * The charts the coach gets, by question type: a line for scales and
 * numbers, a strip for yes/no, bars for choices, a list for text.
 */
export function AnswerCharts({
  labels,
}: {
  labels: {
    scale: string;
    yesNo: string;
    choice: string;
    choices: [string, string, string];
    text: string;
    quotes: [string, string];
  };
}) {
  const w = 240;
  const h = 70;
  const sleep = [6, 7, 5, 7, 8, 6, 7, 8, 7, 5, 6, 7];
  const max = Math.max(...CHOICES);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="shot p-4">
        <p className="text-[0.82rem] font-medium">{labels.scale}</p>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="mt-3 h-auto w-full overflow-visible"
          role="img"
          aria-label={labels.scale}
        >
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={w}
              y1={h * ratio}
              y2={h * ratio}
              stroke="#e7e9f1"
              strokeDasharray="2 4"
            />
          ))}
          <path
            d={linePath(sleep, 1, 10, w, h)}
            fill="none"
            stroke={ORCHID}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="shot p-4">
        <p className="text-[0.82rem] font-medium">{labels.yesNo}</p>
        <div className="mt-4 grid grid-cols-8 gap-1.5" aria-hidden>
          {YES_NO.map((yes, index) => (
            <span
              key={index}
              className={cn(
                'h-9 rounded-md',
                yes ? '' : 'border border-dashed border-ink/20 bg-paper',
              )}
              style={yes ? { background: MINT } : undefined}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground tabular-nums">
          {YES_NO.filter(Boolean).length} / {YES_NO.length}
        </p>
      </div>

      <div className="shot p-4">
        <p className="text-[0.82rem] font-medium">{labels.choice}</p>
        <ul className="mt-3 grid gap-2">
          {labels.choices.map((choice, index) => (
            <li
              key={choice}
              className="grid grid-cols-[5.5rem_1fr_1.5rem] items-center gap-2"
            >
              <span className="truncate text-[0.75rem] text-muted-foreground">
                {choice}
              </span>
              <span className="h-2.5 rounded-full bg-paper">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(CHOICES[index] / max) * 100}%`,
                    background: SKY,
                  }}
                />
              </span>
              <span className="text-right font-mono text-[0.72rem] tabular-nums">
                {CHOICES[index]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="shot p-4">
        <p className="text-[0.82rem] font-medium">{labels.text}</p>
        <ul className="mt-3 grid gap-2">
          {labels.quotes.map((quote) => (
            <li
              key={quote}
              className="border-l-2 border-orchid/50 pl-2.5 text-[0.78rem] leading-snug text-ink/80"
            >
              {quote}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
