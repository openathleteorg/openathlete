import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { AlertTriangle } from 'lucide-react';

export function Problem() {
  const points = [
    m.landing_problem_point_1(),
    m.landing_problem_point_2(),
    m.landing_problem_point_3(),
  ];

  return (
    <Section id="problem" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_problem_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-6 md:grid-cols-3">
            {points.map((point, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-lg border bg-card p-6"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                <p className="text-sm leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

