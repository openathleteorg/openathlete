import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { RevealGroup, RevealItem } from '@/components/site/reveal';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Activity, HeartPulse, History, Watch } from 'lucide-react';

import {
  CAPABILITIES,
  type Capability,
  type Connector,
  capabilityLabel,
  providerMessage,
} from './data';
import { SupportPill } from './parts';

const ICONS: Record<Capability, React.ReactNode> = {
  activities: <Activity />,
  history: <History />,
  metrics: <HeartPulse />,
  workouts: <Watch />,
};

export function ProviderSync({ connector }: { connector: Connector }) {
  const provider = connector.name;
  return (
    <Section tone="paper">
      <Container>
        <SectionHeading
          kicker={m.connect_sync_kicker()}
          title={m.connect_sync_title()}
          lead={m.connect_sync_lead({ provider })}
        />
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map((capability) => {
            const support = connector.support[capability];
            const outgoing = capability === 'workouts';
            return (
              <RevealItem
                key={capability}
                className={cn(
                  'flex flex-col rounded-2xl border bg-white p-6 sm:p-7',
                  outgoing && support === 'yes'
                    ? 'border-coral/40 shadow-[0_20px_40px_-28px_rgb(220_90_60/0.5)]'
                    : 'border-border',
                )}
              >
                <p
                  className={cn(
                    'kicker',
                    outgoing ? 'text-coral-strong' : 'text-sky-strong',
                  )}
                >
                  {outgoing
                    ? m.connect_dir_out({ provider })
                    : m.connect_dir_in({ provider })}
                </p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-3 text-lg font-semibold">
                    <span className="grid size-9 place-items-center rounded-xl border border-border bg-paper [&_svg]:size-[18px]">
                      {ICONS[capability]}
                    </span>
                    {capabilityLabel(capability)}
                  </h3>
                  <SupportPill support={support} />
                </div>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {providerMessage(connector.slug, `note_${capability}`)}
                </p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
