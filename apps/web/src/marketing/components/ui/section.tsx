import { m } from '@/paraglide/messages';
import { ReactNode } from 'react';

interface P {
  id?: string;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  center?: boolean;
  subdued?: boolean;
  className?: string;
}
export function Section({
  id,
  title,
  eyebrow,
  children,
  center,
  subdued,
  className,
}: P) {
  return (
    <section
      id={id}
      className={`py-16 md:py-24 ${subdued ? 'bg-white/2.5' : ''}`.trim()}
    >
      <div
        className={`mx-auto max-w-6xl px-4 sm:px-6 md:px-8 ${className || ''}`.trim()}
      >
        {(title || eyebrow) && (
          <header
            className={`mb-10 ${center ? 'text-center max-w-3xl mx-auto' : ''}`.trim()}
          >
            {eyebrow && (
              <p className="mb-2 text-[10px] tracking-widest uppercase text-[var(--oa-accent)] font-semibold">
                {(m as any)[eyebrow]?.() || eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--oa-fg)] leading-snug">
                {(m as any)[title]?.() || title}
              </h2>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
