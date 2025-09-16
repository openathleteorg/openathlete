import { m } from '@/paraglide/messages';

interface Feature {
  label: string;
}
interface P {
  title: string;
  description: string;
  features?: Feature[];
  cta?: { label: string; href: string };
  accent?: 'primary' | 'secondary';
  className?: string;
}

export function ServiceCard({
  title,
  description,
  features = [],
  cta,
  accent = 'primary',
  className,
}: P) {
  return (
    <div
      className={`group relative rounded-[var(--oa-radius-card)] border border-white/5 bg-white/2.5 p-6 backdrop-blur-sm transition hover:border-[var(--oa-accent)]/60 hover:bg-white/5 h-full flex flex-col ${className || ''}`.trim()}
    >
      <div className="absolute inset-0 rounded-[var(--oa-radius-card)] opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-[var(--oa-accent)]/5 to-[var(--oa-accent-2)]/5 pointer-events-none" />
      <h3 className="text-lg font-semibold text-[var(--oa-fg)] mb-2">
        {(m as any)[title]?.() || title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--oa-muted)] mb-4">
        {(m as any)[description]?.() || description}
      </p>
      {features.length > 0 && (
        <ul className="mb-4 space-y-1.5 text-sm text-[var(--oa-fg)]/80">
          {features.map((f) => (
            <li key={f.label} className="flex gap-2">
              <span
                className={`mt-1 block size-1.5 rounded-full ${accent === 'primary' ? 'bg-[var(--oa-accent)]' : 'bg-[var(--oa-accent-2)]'}`}
              />
              <span>{(m as any)[f.label]?.() || f.label}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-2">
        {cta && (
          <a
            href={cta.href}
            className="inline-flex rounded-md bg-[var(--oa-accent)] px-4 py-2 text-xs font-medium text-[var(--oa-bg)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--oa-accent)] ring-offset-[var(--oa-bg)]"
          >
            {(m as any)[cta.label]?.() || cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
