import { m } from '@/paraglide/messages';
import { ReactNode } from 'react';

interface CTA {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}
interface P {
  title: string;
  subtitle?: string;
  ctas?: CTA[];
  kicker?: string;
  children?: ReactNode;
}

export function Hero({ title, subtitle, ctas = [], kicker, children }: P) {
  return (
    <section className="pt-10 pb-24 text-center relative">
      <div className="mx-auto max-w-3xl">
        {kicker && (
          <p className="mb-4 text-xs font-semibold tracking-widest text-[var(--oa-accent)] uppercase">
            {(m as any)[kicker]?.() || kicker}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[var(--oa-fg)] to-[var(--oa-muted)] bg-clip-text text-transparent leading-tight">
          {(m as any)[title]?.() || title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-lg text-[var(--oa-muted)] leading-relaxed">
            {(m as any)[subtitle]?.() || subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {ctas.map((cta) => (
            <a
              key={cta.href}
              href={cta.href}
              className={
                cta.variant === 'secondary'
                  ? 'px-6 py-3 rounded-lg border border-white/10 text-sm font-medium text-[var(--oa-fg)] hover:bg-white/5 backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oa-accent)]'
                  : 'px-6 py-3 rounded-lg bg-[var(--oa-accent)] text-[var(--oa-bg)] text-sm font-semibold shadow hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--oa-accent)] ring-offset-[var(--oa-bg)]'
              }
            >
              {(m as any)[cta.label]?.() || cta.label}
            </a>
          ))}
        </div>
        {children && <div className="mt-16">{children}</div>}
      </div>
    </section>
  );
}
