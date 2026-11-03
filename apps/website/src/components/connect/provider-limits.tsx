import { Container, Section } from '@/components/site/layout-primitives';
import { RevealGroup, RevealItem } from '@/components/site/reveal';
import { m } from '@/paraglide/messages';
import { AlertTriangle, Server } from 'lucide-react';

import { type Connector, providerMessage } from './data';

export function ProviderLimits({ connector }: { connector: Connector }) {
  const limits = [1, 2, 3].map((i) =>
    providerMessage(connector.slug, `limit_${i}`),
  );
  return (
    <Section tone="ink">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker text-ink-soft">{m.connect_limits_kicker()}</p>
            <h2 className="display-2-side mt-4 text-white">
              {m.connect_limits_title()}
            </h2>
            <p className="mt-5 leading-relaxed text-white/60">
              {m.connect_limits_lead()}
            </p>
          </div>
          <RevealGroup className="grid gap-3 lg:col-span-8">
            {limits.map((limit) => (
              <RevealItem
                key={limit}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#f2c46b]" />
                <p className="leading-relaxed text-white/80">{limit}</p>
              </RevealItem>
            ))}
            {!connector.selfHostReady && (
              <RevealItem className="flex gap-4 rounded-2xl border border-dashed border-white/15 p-5">
                <Server className="mt-0.5 size-5 shrink-0 text-ink-soft" />
                <p className="leading-relaxed text-white/60">
                  {m.connect_limit_selfhost({ provider: connector.name })}
                </p>
              </RevealItem>
            )}
          </RevealGroup>
        </div>
      </Container>
    </Section>
  );
}
