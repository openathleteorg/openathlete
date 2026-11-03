import { cn } from '@/utils/shadcn';
import { Check, ChevronRight, Minus, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { type Connector, type Support, supportLabel } from './data';

export function SupportPill({
  support,
  label,
  tone = 'light',
  className,
}: {
  support: Support;
  /** Replaces "Yes / Limited / No", e.g. "30 days". */
  label?: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const Icon = support === 'yes' ? Check : support === 'partial' ? Minus : X;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.78rem] font-medium whitespace-nowrap',
        support === 'yes' &&
          (tone === 'light'
            ? 'bg-mint/20 text-mint-strong'
            : 'bg-mint/15 text-mint'),
        support === 'partial' &&
          (tone === 'light'
            ? 'bg-[#f2b13c]/20 text-[#8a5a00]'
            : 'bg-[#f2b13c]/15 text-[#f2c46b]'),
        support === 'no' &&
          (tone === 'light'
            ? 'bg-secondary text-muted-foreground'
            : 'bg-white/5 text-white/45'),
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {label ?? supportLabel(support)}
    </span>
  );
}

export function ConnectorLogo({
  connector,
  height = 24,
  className,
}: {
  connector: Pick<Connector, 'logo' | 'name' | 'width'>;
  height?: number;
  className?: string;
}) {
  return (
    <Image
      src={connector.logo}
      alt={connector.name}
      width={Math.round((connector.width / 128) * height)}
      height={height}
      unoptimized
      className={cn('w-auto', className)}
      style={{ height }}
    />
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[0.82rem] text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 opacity-60" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
