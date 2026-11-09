import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

/** true: included; false: not included; a string: what you get. */
type Cell = boolean | string;
type Row = { label: string; cells: [Cell, Cell, Cell] };
type Group = { title: string; rows: Row[] };

/**
 * Free, Supporter and Self-hosted, row by row. Every row comes from the
 * product audit of the code (plans and billing, integrations, AI resolver).
 */
function groups(): Group[] {
  const all: [Cell, Cell, Cell] = [true, true, true];
  const devices = m.pricing_page_cell_dev_accounts();
  return [
    {
      title: m.pricing_page_group_planning(),
      rows: [
        { label: m.pricing_page_row_calendar(), cells: all },
        { label: m.pricing_page_row_builder(), cells: all },
        { label: m.pricing_page_row_week(), cells: all },
        { label: m.pricing_page_row_ical(), cells: all },
      ],
    },
    {
      title: m.pricing_page_group_devices(),
      rows: [
        { label: m.pricing_page_row_sync(), cells: [true, true, devices] },
        { label: m.pricing_page_row_push(), cells: [true, true, devices] },
        { label: m.pricing_page_row_files(), cells: all },
        { label: m.pricing_page_row_export(), cells: all },
      ],
    },
    {
      title: m.pricing_page_group_analysis(),
      rows: [
        { label: m.pricing_page_row_analysis(), cells: all },
        { label: m.pricing_page_row_load(), cells: all },
        { label: m.pricing_page_row_stats(), cells: all },
      ],
    },
    {
      title: m.pricing_page_group_coaching(),
      rows: [
        {
          label: m.pricing_page_row_athletes(),
          cells: [
            '5',
            m.pricing_page_cell_unlimited(),
            m.pricing_page_cell_unlimited(),
          ],
        },
        { label: m.pricing_page_row_dashboard(), cells: all },
        { label: m.pricing_page_row_multicoach(), cells: all },
      ],
    },
    {
      title: m.pricing_page_group_ai(),
      rows: [
        { label: m.pricing_page_row_byok(), cells: all },
        {
          label: m.pricing_page_row_hosted_ai(),
          cells: [
            false,
            m.pricing_page_cell_allowance(),
            m.pricing_page_cell_instance_keys(),
          ],
        },
        { label: m.pricing_page_row_local(), cells: [false, false, true] },
        { label: m.pricing_page_row_mcp(), cells: all },
      ],
    },
    {
      title: m.pricing_page_group_account(),
      rows: [
        {
          label: m.pricing_page_row_hosting(),
          cells: [
            m.pricing_page_cell_france(),
            m.pricing_page_cell_france(),
            m.pricing_page_cell_your_server(),
          ],
        },
        { label: m.pricing_page_row_sso(), cells: [false, false, true] },
        { label: m.pricing_page_row_signup(), cells: [false, false, true] },
      ],
    },
  ];
}

function Value({
  cell,
  highlight,
}: {
  cell: Cell;
  highlight?: boolean;
}): ReactNode {
  if (cell === true) {
    return (
      <span
        className={cn(
          'mx-auto grid size-6 place-items-center rounded-full',
          highlight
            ? 'bg-mint/25 text-mint-strong'
            : 'bg-mint/15 text-mint-strong',
        )}
      >
        <Check className="size-3.5" aria-label={m.pricing_page_cell_yes()} />
      </span>
    );
  }
  if (cell === false) {
    return (
      <Minus
        className="mx-auto size-4 text-ink/25"
        aria-label={m.pricing_page_cell_no()}
      />
    );
  }
  return (
    <span className="block text-center text-[0.82rem] leading-snug font-medium">
      {cell}
    </span>
  );
}

export function FeatureTable({ prices }: { prices: [string, string, string] }) {
  const heads = [
    m.plans_free_name(),
    m.plans_supporter_name(),
    m.plans_selfhost_name(),
  ];
  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-white">
      <table className="w-full table-fixed border-collapse text-left text-[0.92rem]">
        <colgroup>
          <col className="hidden w-[40%] sm:table-column" />
          <col className="w-1/3 sm:w-[20%]" />
          <col className="w-1/3 sm:w-[20%]" />
          <col className="w-1/3 sm:w-[20%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border">
            <th className="hidden px-5 py-5 align-bottom text-[0.78rem] sm:table-cell font-medium text-muted-foreground sm:px-7">
              {m.pricing_page_table_feature()}
            </th>
            {heads.map((head, index) => (
              <th
                key={head}
                className={cn(
                  'px-3 py-5 text-center align-bottom',
                  index === 1 && 'bg-ink text-white',
                )}
              >
                <span className="block text-[1rem] font-semibold">{head}</span>
                <span
                  className={cn(
                    'mt-1 block text-[0.78rem] font-normal',
                    index === 1 ? 'text-white/65' : 'text-muted-foreground',
                  )}
                >
                  {prices[index]}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {groups().map((group) => (
          <tbody key={group.title}>
            <tr>
              <th
                colSpan={4}
                scope="colgroup"
                className="bg-paper px-5 pt-5 pb-2 sm:px-7"
              >
                <span className="kicker text-muted-foreground">
                  {group.title}
                </span>
              </th>
            </tr>
            {group.rows.map((row) => [
              <tr
                key={`${row.label}-label`}
                className="border-t border-border sm:hidden"
              >
                <th
                  colSpan={3}
                  className="px-5 pt-3.5 pb-1 text-[0.88rem] font-medium"
                >
                  {row.label}
                </th>
              </tr>,
              <tr key={row.label} className="sm:border-t sm:border-border">
                <th
                  scope="row"
                  className="hidden px-5 py-3.5 font-normal sm:table-cell sm:px-7"
                >
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={cn(
                      'px-3 py-3.5',
                      index === 1 && 'bg-ink/[0.035]',
                    )}
                  >
                    <Value cell={cell} highlight={index === 1} />
                  </td>
                ))}
              </tr>,
            ])}
          </tbody>
        ))}
      </table>
    </div>
  );
}
