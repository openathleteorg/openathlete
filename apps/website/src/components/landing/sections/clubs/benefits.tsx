import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { BarChart3, Clock3, ShieldCheck, Users } from 'lucide-react';

export function ClubsBenefits() {
  const items = [
    { label: m.clubs_benefits_item_1(), Icon: Users },
    { label: m.clubs_benefits_item_2(), Icon: Clock3 },
    { label: m.clubs_benefits_item_3(), Icon: ShieldCheck },
    { label: m.clubs_benefits_item_4(), Icon: BarChart3 },
  ];

  return (
    <Section id="benefits" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.clubs_benefits_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(({ label, Icon }, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

