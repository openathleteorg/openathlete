import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

/** Contextual links under the method of the trail and hill calculators. */
export function RelatedLinks({
  locale,
  links,
}: {
  locale: SupportedLocale;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="mt-10">
      <h3 className="text-[1.15rem] font-semibold text-ink">
        {m.tools_links_title()}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={localePath(locale, link.href)}
              className="group inline-flex items-center gap-2 text-[0.98rem] font-medium text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-ink"
            >
              {link.label}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
