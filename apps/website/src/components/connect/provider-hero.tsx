import { buttonStyles } from '@/components/site/button';
import { Container } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

import { type Connector, providerMessage } from './data';
import { Breadcrumbs } from './parts';
import { SyncLink } from './sync-link';

export function ProviderHero({
  connector,
  locale,
}: {
  connector: Connector;
  locale: SupportedLocale;
}) {
  const placement = `connect_${connector.slug}_hero`;
  return (
    <section className="relative -mt-[var(--header-height)] overflow-hidden pt-[calc(var(--header-height)+2.5rem)] pb-20 sm:pt-[calc(var(--header-height)+4rem)] sm:pb-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_0%,black,transparent)]" />
        <div className="absolute top-[-10rem] right-[-6rem] h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_30%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-[14rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_18%,transparent),transparent)] blur-2xl" />
      </div>
      <Container className="relative">
        <Breadcrumbs
          items={[
            { name: m.connect_crumb_home(), href: localePath(locale, '/') },
            {
              name: m.site_nav_integrations(),
              href: localePath(locale, '/connect'),
            },
            { name: connector.name },
          ]}
        />
        <div className="mt-10 grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="kicker flex items-center gap-2 text-sky-strong">
              {m.connect_hero_kicker()}
              {connector.isNew && (
                <span className="rounded-full bg-coral/15 px-2 py-0.5 tracking-normal text-coral-strong normal-case">
                  {m.connect_new_badge()}
                </span>
              )}
            </p>
            {/* No entrance animation: the headline is the largest paint */}
            <h1 className="display-1 mt-4">
              {providerMessage(connector.slug, 'h1')}
            </h1>
            <p className="lead mt-6 max-w-2xl">
              {providerMessage(connector.slug, 'lead')}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={signupUrl(placement)}
                event="cta_clicked"
                properties={{ placement, cta: 'signup' }}
                className={buttonStyles({
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                {m.site_cta_start()}
                <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
              </TrackedLink>
              <Link
                href={localePath(locale, '/features/watch-sync')}
                className={buttonStyles({
                  variant: 'secondary',
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                {m.connect_hero_secondary()}
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-[0.85rem] text-muted-foreground">
              <Check className="size-4 text-mint-strong" />
              {m.connect_hero_free()}
            </p>
          </div>
          <Reveal delay={0.1} className="mx-auto w-full max-w-md lg:col-span-5">
            <SyncLink
              name={connector.name}
              logo={connector.logo}
              width={connector.width}
              out={connector.support.workouts === 'yes'}
              labels={{
                in: m.connect_flow_in(),
                out: m.connect_flow_out(),
                noOut: m.connect_flow_no_out(),
              }}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
