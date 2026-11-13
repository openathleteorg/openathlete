import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonStyles } from './button';
import { Container } from './layout-primitives';
import { Reveal } from './reveal';
import { TrackedLink } from './tracked-link';

/** The closing call to action of a page. */
export function CtaBand({
  locale,
  placement,
  title,
  body,
  secondary,
  returnTo,
}: {
  locale: SupportedLocale;
  placement: string;
  title: ReactNode;
  body?: ReactNode;
  secondary?: { href: string; label: string };
  /** Where the new account lands once onboarded */
  returnTo?: string;
}) {
  const second = secondary ?? {
    href: localePath(locale, '/pricing'),
    label: m.site_cta_pricing(),
  };
  return (
    <section className="pt-6 pb-20 sm:pt-10 sm:pb-28">
      <Container>
        <Reveal className="ink-band relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="dot-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="display-2 text-white">{title}</h2>
            {body && <p className="lead mx-auto mt-5 text-ink-soft">{body}</p>}
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedLink
                href={signupUrl(placement, returnTo)}
                event="cta_clicked"
                properties={{ placement, cta: 'signup' }}
                className={buttonStyles({ variant: 'light', size: 'lg' })}
              >
                {m.site_cta_start()}
                <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
              </TrackedLink>
              <Link
                href={second.href}
                className={buttonStyles({
                  variant: 'outlineLight',
                  size: 'lg',
                })}
              >
                {second.label}
              </Link>
            </div>
            <p className="mt-5 text-[0.82rem] text-white/45">
              {m.site_cta_no_card()}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
