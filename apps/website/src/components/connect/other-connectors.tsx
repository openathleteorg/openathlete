import { Container, Section } from '@/components/site/layout-primitives';
import { RevealGroup, RevealItem } from '@/components/site/reveal';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { CONNECTORS, type Connector, providerMessage } from './data';
import { ConnectorLogo } from './parts';

/** Cards linking to the other providers, then to the hub and watch sync. */
export function OtherConnectors({
  current,
  locale,
}: {
  current: Connector;
  locale: SupportedLocale;
}) {
  const others = CONNECTORS.filter((c) => c.slug !== current.slug);
  return (
    <Section tone="paper" className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="kicker text-muted-foreground">
              {m.connect_others_kicker()}
            </p>
            <h2 className="display-3 mt-3">{m.connect_others_title()}</h2>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.92rem] font-medium">
            <Link
              href={localePath(locale, '/connect')}
              className="inline-flex items-center gap-1.5 hover:text-sky-strong"
            >
              {m.connect_hub_link()}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={localePath(locale, '/features/watch-sync')}
              className="inline-flex items-center gap-1.5 hover:text-sky-strong"
            >
              {m.connect_hero_secondary()}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((connector) => (
            <RevealItem key={connector.slug}>
              <Link
                href={localePath(locale, `/connect/${connector.slug}`)}
                className="group flex h-full flex-col rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(5_12_52/0.35)]"
              >
                <div className="flex h-8 items-center">
                  <ConnectorLogo connector={connector} height={20} />
                </div>
                <p className="mt-4 flex-1 text-[0.9rem] leading-relaxed text-muted-foreground">
                  {providerMessage(connector.slug, 'tagline')}
                </p>
                <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
