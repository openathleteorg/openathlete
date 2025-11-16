import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { Clock3, ShieldCheck, Smile, Users } from 'lucide-react';

export function Benefits() {
  const items = [
    { label: m.landing_benefits_item_1(), Icon: Users },
    { label: m.landing_benefits_item_2(), Icon: Clock3 },
    { label: m.landing_benefits_item_3(), Icon: ShieldCheck },
    { label: m.landing_benefits_item_4(), Icon: Smile },
  ];

  return (
    <Section id="benefits">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_benefits_title()}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {/* Intentionally left minimal to keep density controlled */}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(({ label, Icon }, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                {/* subtle accent gradient */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />

                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-sm transition-transform group-hover:-translate-y-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <p className="text-balance text-base font-semibold leading-6">
                    {label}
                  </p>

                  <div className="h-px w-10 bg-border/80" />

                  <p className="text-pretty text-sm text-muted-foreground">
                    {/* Optional room for a brief supporting line if needed later */}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
