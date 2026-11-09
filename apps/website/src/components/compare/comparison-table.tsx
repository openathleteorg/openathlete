import { Logo } from '@/components/site/logo';
import type { Competitor, Verdict } from '@/content/competitors';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { type Footnote, hasMsg, msg } from './text';
import { VerdictMark } from './verdict';

function legend(verdict: Verdict): string | undefined {
  if (verdict === 'yes') return m.compare_legend_yes();
  if (verdict === 'partial') return m.compare_legend_partial();
  if (verdict === 'no') return m.compare_legend_no();
  return undefined;
}

function themNote(
  competitor: Competitor,
  topic: string,
  verdict: Verdict,
  vars: Record<string, string>,
) {
  const key = `compare_${competitor.prefix}_row_${topic}`;
  if (hasMsg(key)) return msg(key, vars);
  return verdict === 'yes' ? m.compare_note_yes() : m.compare_note_no();
}

function oaNote(
  competitor: Competitor,
  topic: string,
  vars: Record<string, string>,
) {
  const key = `compare_${competitor.prefix}_oa_${topic}`;
  return msg(hasMsg(key) ? key : `compare_oa_${topic}`, vars);
}

function Cell({
  verdict,
  note,
  refs,
  highlight,
  name,
}: {
  verdict: Verdict;
  note: string;
  refs?: number[];
  highlight?: boolean;
  name: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-2.5 px-3 py-4 text-[0.88rem] leading-snug sm:px-5 md:text-[0.92rem]',
        highlight && 'bg-sky/[0.06]',
      )}
    >
      {verdict === 'info' ? (
        <span aria-hidden className="hidden size-5 shrink-0 md:block" />
      ) : (
        <VerdictMark
          verdict={verdict}
          label={legend(verdict)}
          className="mt-px"
        />
      )}
      <p className="min-w-0">
        <span className="mb-1 block font-mono text-[0.62rem] tracking-[0.12em] text-muted-foreground uppercase md:hidden">
          {name}
        </span>
        <span className={cn(verdict === 'no' && 'text-muted-foreground')}>
          {note}
        </span>
        {refs && refs.length > 0 && (
          <span className="ml-1 whitespace-nowrap">
            {refs.map((ref) => (
              <a
                key={ref}
                href={`#source-${ref}`}
                className="ml-0.5 align-super font-mono text-[0.62rem] text-sky-strong hover:underline"
              >
                [{ref}]
              </a>
            ))}
          </span>
        )}
      </p>
    </div>
  );
}

export function ComparisonTable({
  competitor,
  footnotes,
  vars,
}: {
  competitor: Competitor;
  footnotes: Footnote[];
  vars: Record<string, string>;
}) {
  const number = (key: string) =>
    footnotes.findIndex((note) => note.key === key) + 1;
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_60px_-40px_rgb(5_12_52/0.35)]">
      <div className="hidden border-b border-border bg-paper md:grid md:grid-cols-[1fr_1.35fr_1.35fr]">
        <div />
        <div className="px-3 py-4 font-semibold sm:px-5">{competitor.name}</div>
        <div className="flex items-center gap-2 bg-sky/[0.08] px-3 py-4 font-semibold sm:px-5">
          <Logo />
        </div>
      </div>
      <dl className="divide-y divide-border">
        {competitor.rows.map((row) => (
          <div
            key={row.topic}
            className="grid grid-cols-2 md:grid-cols-[1fr_1.35fr_1.35fr]"
          >
            <dt className="col-span-2 px-3 pt-4 text-[0.82rem] font-semibold sm:px-5 md:col-span-1 md:py-4 md:text-[0.92rem]">
              {msg(`compare_row_${row.topic}`)}
            </dt>
            <dd className="contents">
              <Cell
                name={competitor.name}
                verdict={row.them}
                note={themNote(competitor, row.topic, row.them, vars)}
                refs={(row.sources ?? [])
                  .filter((key) => key !== 'oa')
                  .map(number)}
              />
              <Cell
                name="OpenAthlete"
                highlight
                verdict={row.oa}
                note={oaNote(competitor, row.topic, vars)}
                refs={(row.sources ?? [])
                  .filter((key) => key === 'oa')
                  .map(number)}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TableLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        'flex flex-wrap gap-x-5 gap-y-2 text-[0.8rem] text-muted-foreground',
        className,
      )}
    >
      {(['yes', 'partial', 'no'] as const).map((verdict) => (
        <li key={verdict} className="flex items-center gap-2">
          <VerdictMark verdict={verdict} />
          {legend(verdict)}
        </li>
      ))}
    </ul>
  );
}
