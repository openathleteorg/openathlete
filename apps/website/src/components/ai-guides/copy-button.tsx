'use client';

import { useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { track } from '@/utils/analytics';
import { cn } from '@/utils/shadcn';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

/** Copies a prompt or the server address, and reports which one. */
export function CopyButton({
  text,
  placement,
  cta,
  tone = 'light',
  className,
}: {
  text: string;
  placement: string;
  cta: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const ml = useMessageLocale();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track('cta_clicked', { placement, cta });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused (insecure context, permissions): the text stays selectable
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.78rem] font-medium transition-colors',
        tone === 'light'
          ? 'border border-border bg-white text-ink hover:bg-paper'
          : 'border border-white/15 text-white/80 hover:bg-white/10',
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-mint-strong" />
      ) : (
        <Copy className="size-3.5" />
      )}
      <span aria-live="polite">
        {copied
          ? m.aig_copied({}, { locale: ml })
          : m.aig_copy({}, { locale: ml })}
      </span>
    </button>
  );
}
