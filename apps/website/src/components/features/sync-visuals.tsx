import { PROVIDERS } from '@/components/site/providers';
import { cn } from '@/utils/shadcn';
import { CalendarDays, Check, FileUp, Minus, Webhook } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

function Logo({ slug, height = 16 }: { slug: string; height?: number }) {
  const provider = PROVIDERS.find((p) => p.slug === slug)!;
  return (
    <Image
      src={provider.logo}
      alt={provider.name}
      width={Math.round((provider.width / 128) * height)}
      height={height}
      unoptimized
      className="w-auto"
      style={{ height }}
    />
  );
}

function Node({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center justify-center rounded-xl border border-border bg-white px-3 shadow-[0_1px_2px_rgb(5_12_52/0.05)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Activities come in from five services and files; workouts go out to three. */
export function SyncFlow({
  labels,
}: {
  labels: {
    in: string;
    out: string;
    files: string;
    api: string;
    calendar: string;
  };
}) {
  return (
    <div className="shot p-5 sm:p-7">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="grid gap-2">
          <p className="kicker mb-1 text-muted-foreground">{labels.in}</p>
          {['garmin', 'coros', 'suunto', 'polar', 'strava'].map((slug) => (
            <Node key={slug}>
              <Logo slug={slug} />
            </Node>
          ))}
          <Node className="gap-2 text-[0.8rem]">
            <FileUp className="size-4" />
            {labels.files}
          </Node>
          <Node className="gap-2 text-[0.8rem]">
            <Webhook className="size-4" />
            {labels.api}
          </Node>
        </div>
        <div className="relative flex flex-col items-center">
          <div className="brand-gradient absolute top-1/2 left-[-1.5rem] h-px w-[calc(100%+3rem)] opacity-60 sm:left-[-3rem] sm:w-[calc(100%+6rem)]" />
          <div className="relative grid size-20 place-items-center rounded-2xl bg-ink shadow-[0_20px_40px_-16px_rgb(5_12_52/0.6)] sm:size-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark-white.svg"
              alt="OpenAthlete"
              className="size-10 sm:size-12"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <p className="kicker mb-1 text-muted-foreground">{labels.out}</p>
          {['garmin', 'suunto', 'coros'].map((slug) => (
            <Node key={slug} className="border-mint/50 bg-mint/[0.06]">
              <Logo slug={slug} />
            </Node>
          ))}
          <Node className="gap-2 text-[0.8rem]">
            <CalendarDays className="size-4" />
            {labels.calendar}
          </Node>
        </div>
      </div>
    </div>
  );
}

export type Cell = { state: 'yes' | 'partial' | 'no' | 'na'; text: string };

export interface MatrixRow {
  name: string;
  slug?: string;
  icon?: ReactNode;
  href?: string;
  cells: Cell[];
}

function CellView({ cell }: { cell: Cell }) {
  if (cell.state === 'na') {
    return <span className="text-muted-foreground/60">{cell.text}</span>;
  }
  return (
    <div className="flex gap-2">
      <span
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
          cell.state === 'yes' && 'bg-mint/25 text-mint-strong',
          cell.state === 'partial' && 'bg-[#f2b13c]/25 text-[#a86d00]',
          cell.state === 'no' && 'bg-secondary text-muted-foreground',
        )}
      >
        {cell.state === 'yes' || cell.state === 'partial' ? (
          <Check className="size-3" />
        ) : (
          <Minus className="size-3" />
        )}
      </span>
      <span
        className={cn(
          'text-[0.85rem] leading-snug',
          cell.state === 'no' ? 'text-muted-foreground' : 'text-ink/85',
        )}
      >
        {cell.text}
      </span>
    </div>
  );
}

/** The brand-by-brand matrix: a table on desktop, cards on a phone. */
export function SyncMatrix({
  columns,
  rows,
}: {
  columns: string[];
  rows: MatrixRow[];
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-white lg:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-paper">
              <th className="w-[13%] px-5 py-4" />
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-5 py-4 font-mono text-[0.7rem] font-medium tracking-[0.12em] text-muted-foreground uppercase"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.name} className="align-top">
                <th scope="row" className="px-5 py-5">
                  <RowName row={row} />
                </th>
                {row.cells.map((cell, index) => (
                  <td key={index} className="px-5 py-5">
                    <CellView cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <div
            key={row.name}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <RowName row={row} />
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {row.cells.map((cell, index) => (
                <div key={index}>
                  <dt className="mb-1 font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
                    {columns[index]}
                  </dt>
                  <dd>
                    <CellView cell={cell} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

function RowName({ row }: { row: MatrixRow }) {
  const content = row.slug ? (
    <Logo slug={row.slug} height={17} />
  ) : (
    <span className="flex items-center gap-2 text-[0.9rem] font-semibold">
      {row.icon}
      {row.name}
    </span>
  );
  return row.href ? (
    <Link
      href={row.href}
      className="inline-flex hover:opacity-70"
      aria-label={row.name}
    >
      {content}
    </Link>
  ) : (
    content
  );
}
