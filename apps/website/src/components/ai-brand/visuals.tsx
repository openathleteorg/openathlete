import { AiExchange } from '@/components/site/visuals/ai-exchange';
import { cn } from '@/utils/shadcn';
import { ArrowDown, Check, Sparkles, X } from 'lucide-react';
import Image from 'next/image';

import type { AiBrand } from './data';

export function BrandLogo({
  brand,
  height,
  dark = false,
  className,
}: {
  brand: AiBrand;
  height: number;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={dark ? brand.logoDark : brand.logo}
      alt={brand.name}
      width={Math.round((brand.width / 128) * height)}
      height={height}
      className={cn('w-auto object-contain', className)}
      style={{ height }}
    />
  );
}

/** A conversation in Claude about the brand's data, in a window frame. */
export function BrandChat({
  brand,
  label,
  prompt,
  reply,
  via,
}: {
  brand: AiBrand;
  label: string;
  prompt: string;
  reply: string;
  via: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#030824] shadow-[0_40px_80px_-30px_rgb(5_12_52/0.7)]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-coral/80" />
          <span className="size-2.5 rounded-full bg-[#f2b13c]/80" />
          <span className="size-2.5 rounded-full bg-mint/70" />
        </span>
        <span className="font-mono text-[0.72rem] text-white/45">{label}</span>
        <span className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-2.5">
          <BrandLogo brand={brand} height={13} dark />
          <span className="font-mono text-[0.7rem] text-white/40">+</span>
          <Image
            src="/logo-mark-white.svg"
            alt="OpenAthlete"
            width={14}
            height={14}
            className="size-3.5"
          />
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <AiExchange
          prompt={prompt}
          reply={reply}
          via={via}
          tools={brand.chatTools}
        />
      </div>
    </div>
  );
}

/**
 * Where the data goes: brand → OpenAthlete → assistant, and whether planned
 * sessions come back to the brand's watch.
 */
export function BrandFlow({
  brand,
  sync,
  mcp,
  back,
}: {
  brand: AiBrand;
  sync: string;
  mcp: string;
  back: string;
}) {
  const node =
    'flex h-14 items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5';
  const link = (label: string) => (
    <div className="flex items-center gap-2 py-2 pl-6">
      <span className="h-6 w-px bg-gradient-to-b from-white/10 to-mint/60" />
      <ArrowDown className="-ml-[0.6rem] size-4 text-mint" aria-hidden />
      <span className="font-mono text-[0.68rem] tracking-wide text-ink-soft uppercase">
        {label}
      </span>
    </div>
  );
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="grid grid-cols-1">
        <div className={node}>
          <BrandLogo brand={brand} height={18} dark />
        </div>
        {link(sync)}
        <div className={cn(node, 'gap-2 border-sky/30 bg-sky/10')}>
          <Image
            src="/logo-mark-white.svg"
            alt=""
            width={18}
            height={18}
            className="size-[18px]"
          />
          <span className="text-[0.9rem] font-semibold text-white">
            OpenAthlete
          </span>
        </div>
        {link(mcp)}
        <div className={cn(node, 'gap-2')}>
          <Sparkles className="size-4 text-orchid" aria-hidden />
          <span className="text-[0.85rem] font-medium text-white">
            Claude · ChatGPT
          </span>
        </div>
      </div>
      <div
        className={cn(
          'mt-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[0.85rem] leading-snug',
          brand.watch
            ? 'border-mint/25 bg-mint/10 text-mint'
            : 'border-dashed border-coral/40 bg-coral/[0.07] text-[#ffb3a3]',
        )}
      >
        {brand.watch ? (
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <X className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span>{back}</span>
      </div>
    </div>
  );
}
