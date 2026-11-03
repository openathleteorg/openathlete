import { shots } from '@/assets/screenshots';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { Screenshot } from '@/components/site/visuals/screenshot';
import { m } from '@/paraglide/messages';

import { type Connector, providerMessage } from './data';

export function ProviderTutorial({ connector }: { connector: Connector }) {
  const provider = connector.name;
  const steps = [
    { title: m.connect_step_1_title(), body: m.connect_step_1_body() },
    {
      title: m.connect_step_2_title({ provider }),
      body: providerMessage(connector.slug, 'step_2'),
    },
    {
      title: m.connect_step_3_title(),
      body: providerMessage(connector.slug, 'step_3'),
    },
    {
      title: m.connect_step_4_title(),
      body: providerMessage(connector.slug, 'step_4'),
    },
  ];
  return (
    <Section>
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="kicker text-muted-foreground">
                {m.connect_steps_kicker()}
              </p>
              <h2 className="display-2-side mt-4">
                {m.connect_steps_title({ provider })}
              </h2>
              <Reveal delay={0.1} className="mt-10 hidden lg:block">
                <Screenshot
                  src={shots.integrations}
                  alt={m.connect_steps_title({ provider })}
                  chrome={false}
                  sizes="420px"
                />
              </Reveal>
            </div>
          </div>
          <RevealGroup className="relative lg:col-span-7">
            <div
              aria-hidden
              className="brand-gradient absolute top-4 bottom-4 left-[1.1rem] w-[2px] opacity-40"
            />
            <div className="grid gap-10">
              {steps.map((step, index) => (
                <RevealItem key={step.title} className="relative flex gap-6">
                  <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-[0.85rem] font-medium text-white ring-4 ring-white">
                    {index + 1}
                  </span>
                  <div className="pt-1">
                    <p className="kicker text-muted-foreground">
                      {m.connect_step_label({ step: String(index + 1) })}
                    </p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.02em]">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </div>
      </Container>
    </Section>
  );
}
