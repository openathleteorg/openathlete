import {
  HUB_COLUMNS,
  HUB_PRICE_ROWS,
  HUB_ROWS,
  QUOTED_PRICES,
  type Verdict,
} from '@/content/competitors';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import Link from 'next/link';

import { money, msg } from './text';
import { VerdictMark } from './verdict';

function legend(verdict: Verdict) {
  if (verdict === 'yes') return m.compare_legend_yes();
  if (verdict === 'partial') return m.compare_legend_partial();
  return m.compare_legend_no();
}

const cellClass = (ours: boolean) =>
  cn('px-4 py-4 align-top text-[0.85rem]', ours && 'bg-sky/[0.07]');

/** Every platform in one table, scrolled sideways on phones. */
export function HubTable({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_60px_-40px_rgb(5_12_52/0.35)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-paper">
              <th className="sticky left-0 z-10 w-32 bg-paper px-3 py-4 sm:w-48 sm:px-4" />
              {HUB_COLUMNS.map((column) => {
                const ours = column.slug === 'openathlete';
                return (
                  <th
                    key={column.slug}
                    scope="col"
                    className={cn(
                      'px-4 py-4 text-[0.88rem] font-semibold whitespace-nowrap',
                      ours && 'bg-sky/[0.1]',
                    )}
                  >
                    {ours ? (
                      column.name
                    ) : (
                      <Link
                        href={localePath(locale, `/compare/${column.slug}`)}
                        className="underline decoration-border underline-offset-4 hover:decoration-ink"
                      >
                        {column.name}
                      </Link>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {HUB_ROWS.map((row) => (
              <tr key={row.topic}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-3 py-4 align-top text-[0.8rem] font-semibold sm:px-4 sm:text-[0.86rem] shadow-[1px_0_0_var(--border)]"
                >
                  {msg(`compare_row_${row.topic}`)}
                </th>
                {HUB_COLUMNS.map((column) => {
                  const cell = row.cells[column.slug];
                  return (
                    <td
                      key={column.slug}
                      className={cellClass(column.slug === 'openathlete')}
                    >
                      <VerdictMark
                        verdict={cell.verdict}
                        label={legend(cell.verdict)}
                      />
                      {cell.note && (
                        <span className="mt-1.5 block text-[0.76rem] leading-snug text-muted-foreground">
                          {msg(`compare_hub_note_${cell.note}`)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {HUB_PRICE_ROWS.map((row) => (
              <tr key={row.topic}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-3 py-4 align-top text-[0.8rem] font-semibold sm:px-4 sm:text-[0.86rem] shadow-[1px_0_0_var(--border)]"
                >
                  {msg(`compare_row_${row.topic}`)}
                </th>
                {HUB_COLUMNS.map((column) => {
                  const cell = row.cells[column.slug];
                  const ours = column.slug === 'openathlete';
                  return (
                    <td key={column.slug} className={cellClass(ours)}>
                      {cell.price ? (
                        <span
                          className={cn(
                            'block font-semibold whitespace-nowrap tabular-nums',
                            ours
                              ? 'text-lg text-mint-strong'
                              : 'text-[0.95rem]',
                          )}
                        >
                          {money(cell.price, locale)}
                        </span>
                      ) : (
                        <span className="block text-[0.78rem] text-muted-foreground">
                          {m.compare_hub_na()}
                        </span>
                      )}
                      {cell.note && (
                        <span className="mt-1 block text-[0.76rem] leading-snug text-muted-foreground">
                          {msg(`compare_hub_note_${cell.note}`, {
                            price: cell.noteVar
                              ? money(QUOTED_PRICES[cell.noteVar], locale)
                              : '',
                          })}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
