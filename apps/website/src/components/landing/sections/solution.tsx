import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { CheckCircle2 } from 'lucide-react';

export function Solution() {
  const items = [
    m.landing_solution_item_1(),
    m.landing_solution_item_2(),
    m.landing_solution_item_3(),
  ];

  return (
    <Section id="solution">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_solution_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-6 md:grid-cols-1">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-lg border bg-card p-6"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <p className="text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
